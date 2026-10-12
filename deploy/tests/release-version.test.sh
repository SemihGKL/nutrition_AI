#!/usr/bin/env bash
# Tests de deploy/release-version.sh sur un faux dépôt distant (dépôt git nu local).
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/release-version.sh"
FAILURES=0

check() {
  local description="$1"; shift
  if "$@"; then echo "  ✓ $description"; else echo "  ✗ $description"; FAILURES=$((FAILURES + 1)); fi
}
version_in() { node -p "require('$1/frontend/package.json').version"; }
remote_version() { git -C "$ROOT/work" show "origin/main:frontend/package.json" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version"; }

write_front() { # $1 = dossier, $2 = version
  mkdir -p "$1/frontend"
  printf '{ "name": "kaloriim", "version": "%s" }\n' "$2" > "$1/frontend/package.json"
  printf '{ "name": "kaloriim", "version": "%s", "lockfileVersion": 3, "requires": true, "packages": { "": { "name": "kaloriim", "version": "%s" } } }\n' "$2" "$2" > "$1/frontend/package-lock.json"
}

# Dépôt distant : un commit en 0.3.0 (celui qui déclenche le déploiement), puis la
# release v0.4.0 poussée par le déploiement précédent.
setup() {
  ROOT="$(mktemp -d)"
  git init -q --bare -b main "$ROOT/origin.git"
  git clone -q "file://$ROOT/origin.git" "$ROOT/seed" 2>/dev/null
  git -C "$ROOT/seed" config user.email t@t; git -C "$ROOT/seed" config user.name t
  write_front "$ROOT/seed" "0.3.0"
  git -C "$ROOT/seed" add -A; git -C "$ROOT/seed" commit -qm "feat: une fonctionnalité"
  TRIGGER=$(git -C "$ROOT/seed" rev-parse HEAD)
  write_front "$ROOT/seed" "0.4.0"
  git -C "$ROOT/seed" commit -qam "chore(release): v0.4.0 [skip ci]"
  git -C "$ROOT/seed" push -q origin main
  # Copie de travail du runner : clone superficiel du commit déclencheur (comme actions/checkout).
  git clone -q "file://$ROOT/origin.git" "$ROOT/work"
  git -C "$ROOT/work" checkout -q "$TRIGGER"
  git -C "$ROOT/work" config user.email ci@ci; git -C "$ROOT/work" config user.name ci
}

echo "Numéro calculé depuis la version déjà publiée"
setup
next=$(cd "$ROOT/work" && bash "$SCRIPT" next)
check "le numéro suivant part de main (0.4.0 → 0.5.0), pas du commit déclencheur" [ "$next" = "0.5.0" ]
check "package.json du build porte ce numéro" [ "$(version_in "$ROOT/work")" = "0.5.0" ]

echo "Publication du numéro"
(cd "$ROOT/work" && RETRY_DELAY=0 bash "$SCRIPT" publish 0.5.0 > "$ROOT/out.log" 2>&1); status=$?
git -C "$ROOT/work" fetch -q origin main
check "termine avec succès" [ "$status" -eq 0 ]
check "main porte la nouvelle version" [ "$(remote_version)" = "0.5.0" ]
check "le commit de release est sur main" git -C "$ROOT/work" log -1 --format=%s origin/main | grep -q "chore(release): v0.5.0"

echo "Publication répétée (déjà à jour)"
(cd "$ROOT/work" && RETRY_DELAY=0 bash "$SCRIPT" publish 0.5.0 > "$ROOT/out.log" 2>&1); status=$?
git -C "$ROOT/work" fetch -q origin main
check "termine avec succès" [ "$status" -eq 0 ]
check "aucun commit en double" [ "$(git -C "$ROOT/work" log --format=%s origin/main | grep -c 'v0.5.0')" -eq 1 ]

echo "Quelqu'un pousse pendant la publication (premier push refusé)"
setup
cat > "$ROOT/origin.git/hooks/pre-receive" <<HOOK
#!/usr/bin/env bash
if [ ! -e "$ROOT/rejected-once" ]; then touch "$ROOT/rejected-once"; echo "refusé"; exit 1; fi
HOOK
chmod +x "$ROOT/origin.git/hooks/pre-receive"
(cd "$ROOT/work" && RETRY_DELAY=0 bash "$SCRIPT" publish 0.5.0 > "$ROOT/out.log" 2>&1); status=$?
git -C "$ROOT/work" fetch -q origin main
check "réessaie et termine avec succès" [ "$status" -eq 0 ]
check "main porte la nouvelle version" [ "$(remote_version)" = "0.5.0" ]

echo
if [ "$FAILURES" -eq 0 ]; then echo "Tous les tests du script de version passent."; else echo "$FAILURES test(s) en échec."; exit 1; fi
