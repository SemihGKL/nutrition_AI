#!/usr/bin/env bash
# Reprise des totaux de calories effacés par le bug de la saisie par repas (v0.2.0 → v0.4.0,
# corrigé en v0.5.0) : modifier les pas, la séance ou confirmer une ANCIENNE saisie (total
# direct, sans détail par repas) remettait son total à 0 en base.
#
# Les totaux sont repris d'une sauvegarde pg_dump faite AVANT la perte (.sql ou .sql.gz) :
# chaque jour aujourd'hui vide (total et repas à 0) qui était, dans la sauvegarde, une ancienne
# saisie avec un total > 0 retrouve ce total. Rien d'autre n'est touché : pas, séance,
# confirmation et jours ressaisis depuis gardent leur valeur actuelle. Les comptes sont
# rapprochés par email (les identifiants peuvent différer d'une base à l'autre) ; un email
# ambigu (comptes ne différant que par la casse) est ignoré.
#
# Usage : restore-legacy-totals.sh <sauvegarde.sql[.gz]> [--apply]
#   sans --apply : simulation, liste les jours qui seraient restaurés, rien n'est modifié ;
#   --apply      : restaure en une transaction (refusé tant que la v0.5.0 n'est pas en prod).
# Connexion : PSQL, par défaut le conteneur Postgres de la prod (cf. CHECKLIST.md §4).
set -euo pipefail

PSQL="${PSQL:-docker exec -i nutritionIA-db psql -U gkl -d nutritionAI}"

usage() { echo "Usage : $0 <sauvegarde.sql|sauvegarde.sql.gz> [--apply]" >&2; exit 2; }
[ $# -ge 1 ] && [ $# -le 2 ] || usage
BACKUP="$1"; APPLY=false
if [ $# -eq 2 ]; then [ "$2" = "--apply" ] && APPLY=true || usage; fi

if [ ! -r "$BACKUP" ]; then echo "❌ Sauvegarde introuvable ou illisible : $BACKUP" >&2; exit 1; fi

read_backup() { case "$BACKUP" in *.gz) gzip -dc "$BACKUP" ;; *) cat "$BACKUP" ;; esac; }

if [ "$(read_backup 2>/dev/null | head -c 5 || true)" = "PGDMP" ]; then
  echo "❌ Sauvegarde au format personnalisé de pg_dump : la convertir d'abord en SQL :" >&2
  echo "   pg_restore -f sauvegarde.sql $BACKUP" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Bloc « COPY public.<table> (colonnes) FROM stdin; … \. » de la sauvegarde → $TMP/<table>.copy
extract() {
  read_backup | awk -v table="$1" '
    $1 == "COPY" && ($2 == "public." table || $2 == table) { inside = 1 }
    inside { print; if ($0 == "\\.") inside = 0 }' > "$TMP/$1.copy"
  if [ ! -s "$TMP/$1.copy" ]; then
    echo "❌ La sauvegarde ne contient pas les données de la table $1 (dump SQL complet attendu)." >&2
    exit 1
  fi
}

# Table temporaire « sauvegarde_<table> » (colonnes de la sauvegarde, en texte) et ses données.
staging() {
  local header column columns=()
  IFS= read -r header < "$TMP/$1.copy"
  header="${header#*(}"; header="${header%) FROM stdin;}"
  IFS=',' read -ra raw <<< "$header"
  for column in "${raw[@]}"; do
    column="${column// /}"; column="${column//\"/}"
    [[ "$column" =~ ^[a-z_][a-z0-9_]*$ ]] || { echo "❌ Colonne inattendue dans la sauvegarde : $column" >&2; exit 1; }
    columns+=("\"$column\"")
  done
  local list typed
  list="$(IFS=,; echo "${columns[*]}")"
  typed="$(printf '%s text, ' "${columns[@]}")"
  echo "CREATE TEMP TABLE sauvegarde_$1 (${typed%, });"
  echo "COPY sauvegarde_$1 ($list) FROM stdin;"
  tail -n +2 "$TMP/$1.copy"
}

extract users
extract daily_calories

{
  echo "SET client_min_messages TO warning;"
  echo "BEGIN;"
  if $APPLY; then
    cat <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '23' AND success) THEN
    RAISE EXCEPTION 'Correctif absent de la prod (migration V23 non appliquée) : déployer la v0.5.0 avant de restaurer, sinon les totaux peuvent être effacés à nouveau.';
  END IF;
END $$;
SQL
  fi
  staging users
  staging daily_calories
  cat <<'SQL'
-- Sauvegarde antérieure à la saisie par repas (V17) : aucun détail par repas.
ALTER TABLE sauvegarde_daily_calories
  ADD COLUMN IF NOT EXISTS breakfast_kcal text, ADD COLUMN IF NOT EXISTS lunch_kcal text,
  ADD COLUMN IF NOT EXISTS snack_kcal text, ADD COLUMN IF NOT EXISTS dinner_kcal text;

-- Comptes rapprochés par email, insensible à la casse, seulement s'il n'y a aucune ambiguïté.
CREATE TEMP TABLE comptes AS
SELECT s.id AS ancien_id, u.id AS user_id
FROM sauvegarde_users s
JOIN users u ON lower(trim(u.email)) = lower(trim(s.email))
WHERE (SELECT count(*) FROM users x WHERE lower(trim(x.email)) = lower(trim(s.email))) = 1
  AND (SELECT count(*) FROM sauvegarde_users y WHERE lower(trim(y.email)) = lower(trim(s.email))) = 1;

-- Jours vides aujourd'hui qui étaient, dans la sauvegarde, une ancienne saisie avec un total.
CREATE TEMP TABLE reprise AS
SELECT d.id, u.email, d.date, s.calories_consumed::int AS total
FROM sauvegarde_daily_calories s
JOIN comptes c ON c.ancien_id = s.user_id
JOIN users u ON u.id = c.user_id
JOIN daily_calories d ON d.user_id = c.user_id AND d.date = s.date::date
WHERE coalesce(s.calories_consumed::int, 0) > 0
  AND coalesce(s.breakfast_kcal::int, 0) + coalesce(s.lunch_kcal::int, 0)
    + coalesce(s.snack_kcal::int, 0) + coalesce(s.dinner_kcal::int, 0) = 0
  AND coalesce(d.calories_consumed, 0) = 0
  AND d.breakfast_kcal + d.lunch_kcal + d.snack_kcal + d.dinner_kcal = 0;

SELECT email AS compte, date AS jour, total AS "kcal restaurées" FROM reprise ORDER BY email, date;
SELECT count(*) AS jours FROM reprise \gset
SQL
  if $APPLY; then
    cat <<'SQL'
UPDATE daily_calories d SET calories_consumed = r.total
FROM reprise r
WHERE d.id = r.id
  AND coalesce(d.calories_consumed, 0) = 0
  AND d.breakfast_kcal + d.lunch_kcal + d.snack_kcal + d.dinner_kcal = 0;
COMMIT;
\echo :jours 'jour(s) restauré(s).'
SQL
  else
    echo "ROLLBACK;"
    echo "\\echo :jours 'jour(s) à restaurer (simulation : rien n''a été modifié).'"
  fi
} > "$TMP/reprise.sql"

$PSQL -X -q -v ON_ERROR_STOP=1 -P pager=off < "$TMP/reprise.sql"

if $APPLY; then
  echo "✅ Reprise terminée. Les utilisateurs concernés doivent recharger l'app pour voir leurs totaux."
else
  echo "Pour restaurer : $0 $BACKUP --apply"
fi
