#!/usr/bin/env bash
# Numéro de version de l'app : +0.1 (minor) à chaque déploiement de main.
#
#   release-version.sh next              calcule le numéro à partir de celui déjà publié sur
#                                        main, l'écrit dans frontend/package.json, l'affiche
#   release-version.sh publish <version> commite ce numéro par-dessus le main le plus récent
#                                        et le pousse (3 essais si quelqu'un pousse entre-temps)
#
# On part toujours de main et non du commit déployé : un déploiement en file d'attente ne
# voit pas, dans son propre commit, la version poussée par le déploiement précédent.
set -euo pipefail

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
FRONT_DIR="${FRONT_DIR:-frontend}"
RETRY_DELAY="${RETRY_DELAY:-5}"

fetch_branch() {
  git fetch --quiet --depth=1 "$REMOTE" "+refs/heads/$BRANCH:refs/remotes/$REMOTE/$BRANCH"
}

published_version() {
  fetch_branch
  git show "$REMOTE/$BRANCH:$FRONT_DIR/package.json" \
    | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version"
}

set_version() { # $1 = version
  (cd "$FRONT_DIR" && npm version "$1" --no-git-tag-version --allow-same-version > /dev/null)
}

case "${1:-}" in
  next)
    set_version "$(published_version)"
    (cd "$FRONT_DIR" && npm version minor --no-git-tag-version > /dev/null)
    node -p "require('./$FRONT_DIR/package.json').version"
    ;;
  publish)
    version="${2:?version attendue}"
    for attempt in 1 2 3; do
      fetch_branch
      git checkout --quiet -f -B release-version "$REMOTE/$BRANCH"
      set_version "$version"
      git add "$FRONT_DIR/package.json" "$FRONT_DIR/package-lock.json"
      if git diff --cached --quiet; then
        echo "main est déjà en v$version."
        exit 0
      fi
      git commit --quiet -m "chore(release): v$version [skip ci]"
      if git push --quiet "$REMOTE" "HEAD:$BRANCH"; then
        echo "v$version publiée sur $BRANCH."
        exit 0
      fi
      echo "Push refusé (essai $attempt/3) : main a bougé, nouvel essai…"
      sleep "$RETRY_DELAY"
    done
    echo "❌ Impossible de publier v$version sur $BRANCH."
    exit 1
    ;;
  *)
    echo "Usage : $0 next | publish <version>" >&2
    exit 2
    ;;
esac
