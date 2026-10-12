#!/usr/bin/env bash
# Tests du script de déploiement (deploy/release.sh) sur un faux VPS :
# dossiers temporaires, faux systemctl (mémorise le JAR « démarré ») et faux curl
# (santé 200, sauf si le JAR démarré contient « broken »).
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/release.sh"
FAILURES=0

setup() {
  ROOT="$(mktemp -d)"
  export APP_DIR="$ROOT/opt" WEB_DIR="$ROOT/www" STATE="$ROOT/state"
  mkdir -p "$APP_DIR" "$WEB_DIR/assets" "$STATE" "$ROOT/bin"
  cat > "$ROOT/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
echo "$*" >> "$STATE/systemctl.log"
# Simule un redémarrage refusé (ex. règle sudoers qui ne correspond pas) pour ce JAR.
if [ -n "${RESTART_REFUSED_FOR:-}" ] && grep -qx "$RESTART_REFUSED_FOR" "$APP_DIR/app.jar"; then exit 1; fi
cp "$APP_DIR/app.jar" "$STATE/running"
STUB
  cat > "$ROOT/bin/curl" <<'STUB'
#!/usr/bin/env bash
if grep -q broken "$STATE/running" 2>/dev/null; then printf 500; else printf 200; fi
STUB
  cat > "$ROOT/bin/journalctl" <<'STUB'
#!/usr/bin/env bash
echo "(journal simulé)"
STUB
  chmod +x "$ROOT/bin/"*
  export PATH="$ROOT/bin:$PATH" SYSTEMCTL="$ROOT/bin/systemctl" JOURNALCTL="$ROOT/bin/journalctl"
  export HEALTH_TRIES=2 HEALTH_DELAY=0
}

new_release() { # $1 = contenu du nouveau JAR
  echo "$1" > "$APP_DIR/app.jar.new"
  mkdir -p "$APP_DIR/frontend-new/assets"
  echo "index v2 → new.js" > "$APP_DIR/frontend-new/index.html"
  echo "sw v2" > "$APP_DIR/frontend-new/sw.js"
  echo "new" > "$APP_DIR/frontend-new/assets/new.js"
}

current_release() {
  echo "v1" > "$APP_DIR/app.jar"
  echo "index v1" > "$WEB_DIR/index.html"
  echo "sw v1" > "$WEB_DIR/sw.js"
  echo "old" > "$WEB_DIR/assets/recent-old.js"; touch -d '5 days ago' "$WEB_DIR/assets/recent-old.js"
  echo "old" > "$WEB_DIR/assets/stale.js";      touch -d '40 days ago' "$WEB_DIR/assets/stale.js"
}

check() { # $1 = description, puis la condition
  local description="$1"; shift
  if "$@"; then echo "  ✓ $description"; else echo "  ✗ $description"; FAILURES=$((FAILURES + 1)); fi
}
content_is() { [ "$(cat "$1" 2>/dev/null)" = "$2" ]; }

echo "Nouvelle version saine"
setup; current_release; new_release "v2"
bash "$SCRIPT" > "$ROOT/out.log" 2>&1; status=$?
check "termine avec succès" [ "$status" -eq 0 ]
check "le nouveau JAR est en place et démarré" content_is "$STATE/running" "v2"
check "l'ancien JAR est gardé (app.jar.prev)" content_is "$APP_DIR/app.jar.prev" "v1"
check "le nouveau front est publié" content_is "$WEB_DIR/index.html" "index v2 → new.js"
check "le service worker est publié" content_is "$WEB_DIR/sw.js" "sw v2"
check "les nouveaux assets sont publiés" [ -f "$WEB_DIR/assets/new.js" ]
check "un asset récent de l'ancienne version est conservé" [ -f "$WEB_DIR/assets/recent-old.js" ]
check "un asset de plus de 30 jours est supprimé" [ ! -e "$WEB_DIR/assets/stale.js" ]
check "le dossier temporaire du front est nettoyé" [ ! -e "$APP_DIR/frontend-new" ]

echo "Nouvelle version qui ne démarre pas"
setup; current_release; new_release "broken"
bash "$SCRIPT" > "$ROOT/out.log" 2>&1; status=$?
check "le déploiement échoue" [ "$status" -ne 0 ]
check "l'ancien JAR est restauré" content_is "$APP_DIR/app.jar" "v1"
check "l'ancienne version tourne à nouveau" content_is "$STATE/running" "v1"
check "le front en place n'est pas touché" content_is "$WEB_DIR/index.html" "index v1"
check "aucun nouvel asset publié" [ ! -e "$WEB_DIR/assets/new.js" ]
check "les logs du service sont affichés" grep -q "journal simulé" "$ROOT/out.log"

echo "Redémarrage refusé pour la nouvelle version"
setup; current_release; new_release "v2"; export RESTART_REFUSED_FOR="v2"
bash "$SCRIPT" > "$ROOT/out.log" 2>&1; status=$?
unset RESTART_REFUSED_FOR
check "le déploiement échoue" [ "$status" -ne 0 ]
check "l'ancien JAR est remis en place" content_is "$APP_DIR/app.jar" "v1"
check "l'ancienne version est redémarrée" content_is "$STATE/running" "v1"
check "le front en place n'est pas touché" content_is "$WEB_DIR/index.html" "index v1"

if [ "$(id -u)" -ne 0 ]; then
  echo "Publication du front impossible (backend sain)"
  setup; current_release; new_release "v2"; chmod -R a-w "$WEB_DIR"
  bash "$SCRIPT" > "$ROOT/out.log" 2>&1; status=$?
  chmod -R u+w "$WEB_DIR"
  check "le déploiement est signalé en échec" [ "$status" -ne 0 ]
  check "le nouveau backend sain reste en ligne" content_is "$STATE/running" "v2"
  check "l'ancien front reste servi" content_is "$WEB_DIR/index.html" "index v1"
  check "le problème est expliqué" grep -q "front" "$ROOT/out.log"
fi

echo "Fichiers de la release absents"
setup; current_release
bash "$SCRIPT" > "$ROOT/out.log" 2>&1; status=$?
check "le déploiement échoue" [ "$status" -ne 0 ]
check "le service n'est pas redémarré" [ ! -e "$STATE/systemctl.log" ]
check "le JAR en place est intact" content_is "$APP_DIR/app.jar" "v1"

echo "Premier déploiement (aucune version en place)"
setup; new_release "v2"
bash "$SCRIPT" > "$ROOT/out.log" 2>&1; status=$?
check "termine avec succès" [ "$status" -eq 0 ]
check "le JAR est en place" content_is "$APP_DIR/app.jar" "v2"

echo
if [ "$FAILURES" -eq 0 ]; then echo "Tous les tests du script de déploiement passent."; else echo "$FAILURES test(s) en échec."; exit 1; fi
