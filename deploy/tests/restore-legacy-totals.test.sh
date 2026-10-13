#!/usr/bin/env bash
# Tests du script de reprise des totaux effacés (deploy/restore-legacy-totals.sh) sur un vrai
# Postgres : bases jetables créées avec les migrations du dépôt, sauvegardes produites par
# pg_dump. Connexion via les variables libpq (PGHOST, PGPORT, PGUSER, PGPASSWORD).
# Sans Postgres joignable : ignorés en local, en échec en CI.
set -uo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$DEPLOY_DIR/restore-legacy-totals.sh"
MIGRATIONS="$DEPLOY_DIR/../backend/src/main/resources/db/migration"
FAILURES=0
WORK="$(mktemp -d)"
DATABASES=()

if ! psql -X -q -d postgres -c 'SELECT 1' > /dev/null 2>&1; then
  if [ -n "${CI:-}" ]; then echo "❌ Postgres injoignable (PGHOST=${PGHOST:-})."; exit 1; fi
  echo "Postgres injoignable : tests du script de reprise ignorés en local."; exit 0
fi

cleanup() { for db in "${DATABASES[@]}"; do dropdb --if-exists "$db"; done; rm -rf "$WORK"; }
trap cleanup EXIT

sql() { psql -X -q -At -v ON_ERROR_STOP=1 -d "$1" -c "$2"; }

# Base neuve migrée jusqu'à la version $2 (toutes par défaut), nom renvoyé dans la variable $1.
new_db() {
  local db="reprise_test_$$_${#DATABASES[@]}" max="${2:-9999}" file version
  createdb "$db" && DATABASES+=("$db")
  sql "$db" "CREATE TABLE flyway_schema_history (version varchar(50), success boolean NOT NULL)"
  for file in $(ls "$MIGRATIONS" | sort -V); do
    version="${file%%__*}"; version="${version#V}"
    [ "$version" -le "$max" ] || continue
    psql -X -q -v ON_ERROR_STOP=1 -d "$db" -f "$MIGRATIONS/$file" > /dev/null || { echo "Migration $file en échec"; exit 1; }
    sql "$db" "INSERT INTO flyway_schema_history VALUES ('$version', true)"
  done
  printf -v "$1" '%s' "$db"
}

add_user() { # $1 = base, $2 = email → id
  sql "$1" "INSERT INTO users (username, email, gender, age, height, password)
            VALUES ('$2', '$2', 'MALE', 30, 180, 'x') RETURNING id"
}

# Prod avant la perte : anciennes saisies (total direct, repas à 0) et une saisie par repas.
# $1 = dernière migration appliquée en prod (toutes par défaut).
prod_before_loss() {
  new_db PROD "${1:-9999}"
  ALICE=$(add_user "$PROD" alice@example.com); BOB=$(add_user "$PROD" bob@example.com)
  sql "$PROD" "INSERT INTO daily_calories (user_id, date, calories_consumed, is_confirmed, steps, calories_burned, lunch_kcal) VALUES
    ($ALICE, '2026-09-01', 1800, false, 5000, 0, 0),
    ($ALICE, '2026-09-02', 2000, true,  6000, 0, 0),
    ($ALICE, '2026-09-03', 1500, false, 0,    0, 0),
    ($ALICE, '2026-09-04', 600,  false, 0,    0, 600),
    ($BOB,   '2026-09-01', 2200, false, 0,    0, 0)"
}

# Ce qui s'est passé ensuite en prod (bug + saisies normales des utilisateurs).
prod_after_loss() {
  sql "$PROD" "
    -- bug : pas modifiés sur une ancienne saisie → total remis à 0
    UPDATE daily_calories SET calories_consumed = 0, steps = 8000 WHERE user_id = $ALICE AND date = '2026-09-01';
    -- bug : confirmation d'une ancienne saisie → total remis à 0
    UPDATE daily_calories SET calories_consumed = 0, is_confirmed = true WHERE user_id = $BOB AND date = '2026-09-01';
    -- ancienne saisie ressaisie depuis par repas
    UPDATE daily_calories SET calories_consumed = 300, breakfast_kcal = 300 WHERE user_id = $ALICE AND date = '2026-09-03';
    -- saisie par repas volontairement remise à 0
    UPDATE daily_calories SET calories_consumed = 0, lunch_kcal = 0 WHERE user_id = $ALICE AND date = '2026-09-04';
    -- jour créé après la sauvegarde, sans calories
    INSERT INTO daily_calories (user_id, date, calories_consumed, is_confirmed, steps, calories_burned)
      VALUES ($ALICE, '2026-10-10', 0, false, 3000, 0)"
}

restore() { # arguments du script → sortie dans $WORK/out.log, code dans $status
  PSQL="psql -d $PROD" bash "$SCRIPT" "$@" > "$WORK/out.log" 2>&1; status=$?
}

check() { # $1 = description, puis la condition
  local description="$1"; shift
  if "$@"; then echo "  ✓ $description"; else echo "  ✗ $description"; FAILURES=$((FAILURES + 1)); fi
}
day_is() { # $1 = user, $2 = date, $3 = colonne, $4 = valeur attendue
  [ "$(sql "$PROD" "SELECT $3 FROM daily_calories WHERE user_id = $1 AND date = '$2'")" = "$4" ]
}
logged() { grep -qE "$1" "$WORK/out.log"; }
not_logged() { ! grep -qE "$1" "$WORK/out.log"; }

echo "Simulation (sans --apply)"
prod_before_loss; pg_dump -d "$PROD" -f "$WORK/sauvegarde.sql"; prod_after_loss
restore "$WORK/sauvegarde.sql"
check "termine avec succès" [ "$status" -eq 0 ]
check "liste le jour effacé d'Alice avec son total" logged "alice@example.com.*2026-09-01.*1800"
check "liste le jour effacé de Bob avec son total" logged "bob@example.com.*2026-09-01.*2200"
check "ne liste ni les jours intacts, ni ressaisis, ni postérieurs" not_logged "2026-09-0[234]|2026-10-10"
check "annonce 2 jours à restaurer" logged "2 jour"
check "ne modifie rien" day_is "$ALICE" 2026-09-01 calories_consumed 0

echo "Restauration (--apply)"
restore "$WORK/sauvegarde.sql" --apply
check "termine avec succès" [ "$status" -eq 0 ]
check "le total d'Alice est restauré" day_is "$ALICE" 2026-09-01 calories_consumed 1800
check "le total de Bob est restauré" day_is "$BOB" 2026-09-01 calories_consumed 2200
check "les pas saisis depuis sont conservés" day_is "$ALICE" 2026-09-01 steps 8000
check "la confirmation faite depuis est conservée" day_is "$BOB" 2026-09-01 is_confirmed t
check "le jour intact est inchangé" day_is "$ALICE" 2026-09-02 calories_consumed 2000
check "le jour ressaisi par repas garde la nouvelle saisie" day_is "$ALICE" 2026-09-03 calories_consumed 300
check "la saisie par repas remise à 0 reste à 0" day_is "$ALICE" 2026-09-04 calories_consumed 0
check "le jour postérieur à la sauvegarde reste à 0" day_is "$ALICE" 2026-10-10 calories_consumed 0
check "annonce 2 jours restaurés" logged "2 jour"

echo "Relance après restauration"
restore "$WORK/sauvegarde.sql" --apply
check "termine avec succès" [ "$status" -eq 0 ]
check "plus rien à restaurer" logged "0 jour"
check "les totaux restaurés sont inchangés" day_is "$ALICE" 2026-09-01 calories_consumed 1800

echo "Sauvegarde compressée (.sql.gz)"
prod_before_loss; pg_dump -d "$PROD" | gzip > "$WORK/sauvegarde.sql.gz"; prod_after_loss
restore "$WORK/sauvegarde.sql.gz" --apply
check "termine avec succès" [ "$status" -eq 0 ]
check "le total d'Alice est restauré" day_is "$ALICE" 2026-09-01 calories_consumed 1800

echo "Sauvegarde antérieure à la saisie par repas (V16), identifiants et casse différents"
new_db OLD 16
OLD_BOB=$(add_user "$OLD" bob@example.com); OLD_ALICE=$(add_user "$OLD" ALICE@Example.com)
sql "$OLD" "INSERT INTO daily_calories (user_id, date, calories_consumed, is_confirmed, steps, calories_burned) VALUES
  ($OLD_ALICE, '2026-09-01', 1800, false, 5000, 0), ($OLD_BOB, '2026-09-01', 2200, false, 0, 0)"
pg_dump -d "$OLD" -f "$WORK/ancienne.sql"
prod_before_loss; prod_after_loss
restore "$WORK/ancienne.sql" --apply
check "termine avec succès" [ "$status" -eq 0 ]
check "Alice retrouve son total (rapprochement par email)" day_is "$ALICE" 2026-09-01 calories_consumed 1800
check "Bob retrouve son total" day_is "$BOB" 2026-09-01 calories_consumed 2200

echo "Email ambigu dans la sauvegarde (comptes ne différant que par la casse, possible avant V24)"
new_db AMBIGUOUS 23
OLD_ALICE=$(add_user "$AMBIGUOUS" alice@example.com); OLD_ALICE_BIS=$(add_user "$AMBIGUOUS" Alice@Example.com)
OLD_BOB=$(add_user "$AMBIGUOUS" bob@example.com)
sql "$AMBIGUOUS" "INSERT INTO daily_calories (user_id, date, calories_consumed, is_confirmed, steps, calories_burned) VALUES
  ($OLD_ALICE, '2026-09-01', 1800, false, 0, 0), ($OLD_ALICE_BIS, '2026-09-01', 2500, false, 0, 0),
  ($OLD_BOB, '2026-09-01', 2200, false, 0, 0)"
pg_dump -d "$AMBIGUOUS" -f "$WORK/ambigue.sql"
prod_before_loss; prod_after_loss
restore "$WORK/ambigue.sql" --apply
check "termine avec succès" [ "$status" -eq 0 ]
check "le compte ambigu n'est pas restauré" day_is "$ALICE" 2026-09-01 calories_consumed 0
check "les autres comptes le sont" day_is "$BOB" 2026-09-01 calories_consumed 2200

echo "Email ambigu en prod (v0.5.0 : migrations jusqu'à V23, avant l'unicité sans casse)"
prod_before_loss 23; pg_dump -d "$PROD" -f "$WORK/sauvegarde.sql"; prod_after_loss
ALICE_BIS=$(add_user "$PROD" Alice@Example.com)
sql "$PROD" "INSERT INTO daily_calories (user_id, date, calories_consumed, is_confirmed, steps, calories_burned)
             VALUES ($ALICE_BIS, '2026-09-01', 0, false, 0, 0)"
restore "$WORK/sauvegarde.sql" --apply
check "termine avec succès" [ "$status" -eq 0 ]
check "aucun des deux comptes n'est restauré" day_is "$ALICE_BIS" 2026-09-01 calories_consumed 0
check "ni le compte d'origine" day_is "$ALICE" 2026-09-01 calories_consumed 0
check "les autres comptes le sont" day_is "$BOB" 2026-09-01 calories_consumed 2200

echo "Correctif pas encore déployé en prod (v0.4.0, migrations jusqu'à V20)"
prod_before_loss; pg_dump -d "$PROD" -f "$WORK/sauvegarde.sql"; prod_after_loss
sql "$PROD" "DELETE FROM flyway_schema_history WHERE version::int > 20"
restore "$WORK/sauvegarde.sql"
check "la simulation reste possible" [ "$status" -eq 0 ]
restore "$WORK/sauvegarde.sql" --apply
check "la restauration est refusée" [ "$status" -ne 0 ]
check "le message demande de déployer la v0.5.0" logged "v0\.5\.0"
check "rien n'est modifié" day_is "$ALICE" 2026-09-01 calories_consumed 0

echo "Sauvegardes inutilisables"
prod_before_loss
pg_dump -Fc -d "$PROD" -f "$WORK/sauvegarde.dump"
restore "$WORK/sauvegarde.dump"
check "format personnalisé refusé" [ "$status" -ne 0 ]
check "avec la commande de conversion" logged "pg_restore"
pg_dump -d "$PROD" -t users -f "$WORK/sans-saisies.sql"
restore "$WORK/sans-saisies.sql"
check "sauvegarde sans les saisies refusée" [ "$status" -ne 0 ]
check "en nommant la table manquante" logged "daily_calories"
restore "$WORK/absente.sql"
check "fichier absent refusé" [ "$status" -ne 0 ]
restore "$WORK/sauvegarde.sql" --appliquer
check "option inconnue refusée" [ "$status" -ne 0 ]

echo
if [ "$FAILURES" -eq 0 ]; then echo "Tous les tests du script de reprise passent."; else echo "$FAILURES test(s) en échec."; exit 1; fi
