#!/usr/bin/env bash
# Mise en ligne d'une release sur le VPS (lancé par .github/workflows/deploy.yml).
#
# La CI a déposé à côté de la version en place :
#   /opt/nutritionIA/app.jar.new      nouveau backend
#   /opt/nutritionIA/frontend-new/    nouveau front
#
# 1. bascule le JAR par renommage (la JVM en cours garde l'ancien fichier ouvert) et
#    conserve l'ancien en app.jar.prev ;
# 2. redémarre et attend /actuator/health ;
# 3. OK  → publie le front (assets d'abord, index.html et sw.js en dernier) ;
#    KO  → restaure app.jar.prev, redémarre, laisse le front intact, et échoue.
#
# Droits requis : écriture sur APP_DIR et WEB_DIR, sudo limité à
# « systemctl restart nutritionIA » et « journalctl -u nutritionIA » (cf. CHECKLIST.md).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/nutritionIA}"
WEB_DIR="${WEB_DIR:-/var/www/nutritionIA}"
SERVICE="${SERVICE:-nutritionIA}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/actuator/health/readiness}"
HEALTH_TRIES="${HEALTH_TRIES:-30}"
HEALTH_DELAY="${HEALTH_DELAY:-3}"
SYSTEMCTL="${SYSTEMCTL:-sudo systemctl}"
JOURNALCTL="${JOURNALCTL:-sudo journalctl}"
ASSET_RETENTION_DAYS="${ASSET_RETENTION_DAYS:-30}"

JAR="$APP_DIR/app.jar"
NEW_JAR="$APP_DIR/app.jar.new"
PREV_JAR="$APP_DIR/app.jar.prev"
NEW_FRONT="$APP_DIR/frontend-new"

# Sonde de readiness RÉELLE : `systemctl is-active` répond « active » dès que le process
# java est forké, même si le contexte Spring plante juste après (incident 07/2026,
# cf. deploy/TROUBLESHOOTING.md). Readiness = application + base, sans le serveur mail.
healthy() {
  local code
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    code=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
    [ "$code" = "200" ] && return 0
    sleep "$HEALTH_DELAY"
  done
  return 1
}

# Appelée dans un « if » : bash y ignore set -e, chaque étape vérifie donc son résultat.
publish_frontend() {
  mkdir -p "$WEB_DIR" || return 1
  # Les fichiers référencés d'abord : index.html et sw.js ne pointent jamais vers un
  # fichier pas encore copié.
  tar -C "$NEW_FRONT" --exclude=./index.html --exclude=./sw.js -cf - . | tar -C "$WEB_DIR" -xf - || return 1
  # Points d'entrée remplacés par renommage : nginx ne sert jamais un fichier à moitié écrit.
  for entry in index.html sw.js; do
    if [ -f "$NEW_FRONT/$entry" ]; then
      cp "$NEW_FRONT/$entry" "$WEB_DIR/.$entry.tmp" && mv -f "$WEB_DIR/.$entry.tmp" "$WEB_DIR/$entry" || return 1
    fi
  done
  # Anciens assets : gardés un temps pour les onglets encore ouverts sur l'ancienne version.
  if [ -d "$WEB_DIR/assets" ]; then
    find "$WEB_DIR/assets" -type f -mtime +"$ASSET_RETENTION_DAYS" -delete || true
  fi
  rm -rf "$NEW_FRONT"
}

# Revient à la version précédente (front inchangé) et fait échouer le déploiement.
rollback_and_fail() {
  if [ -f "$PREV_JAR" ]; then
    echo "↩️  Retour à la version précédente…"
    mv -f "$PREV_JAR" "$JAR"
    if $SYSTEMCTL restart "$SERVICE" && healthy; then
      echo "↩️  Version précédente restaurée : la prod tourne, le front n'a pas été modifié."
    else
      echo "🚨 La version précédente ne répond pas non plus : intervention manuelle requise."
    fi
  else
    echo "🚨 Aucune version précédente à restaurer : intervention manuelle requise."
  fi
  rm -rf "$NEW_FRONT"
  exit 1
}

if [ ! -f "$NEW_JAR" ] || [ ! -d "$NEW_FRONT" ]; then
  echo "❌ Release incomplète : $NEW_JAR et $NEW_FRONT doivent exister."
  exit 1
fi

if [ -f "$JAR" ]; then cp -p "$JAR" "$PREV_JAR"; fi
mv -f "$NEW_JAR" "$JAR"

echo "Redémarrage du backend, attente de $HEALTH_URL…"
if ! $SYSTEMCTL restart "$SERVICE"; then
  echo "❌ Redémarrage du service refusé (droits sudo ?)."
  rollback_and_fail
fi
if ! healthy; then
  echo "❌ Le nouveau backend ne répond pas — dernières lignes de log :"
  $JOURNALCTL -u "$SERVICE" --no-pager -n 60 || true
  rollback_and_fail
fi

if ! publish_frontend; then
  echo "⚠️  Backend en ligne, mais la publication du front a échoué : l'ancien front reste servi."
  echo "    Vérifier les droits sur $WEB_DIR puis relancer le déploiement."
  exit 1
fi
echo "✅ Release en ligne (backend sain, front publié)."
