# Dépannage prod — NutritionIA

Guide de diagnostic quand l'app répond mal en prod (502, page qui ne charge pas,
inscription/connexion qui échoue). À lire avec `deploy/README.md` et
`deploy/CHECKLIST.md`.

---

## Comprendre un 502

Topologie : `navigateur → nginx (443/80) → backend Spring Boot 127.0.0.1:8080 → Postgres`.

- **502 Bad Gateway** = nginx **n'a pas obtenu de réponse valide** du backend. Ce
  n'est PAS une erreur applicative : le process Spring n'écoute pas / est mort /
  crashe au démarrage / écoute sur un autre port que celui configuré dans nginx.
- **500** = le backend a répondu, mais avec une erreur (là, regarder le code).

> Comme l'onboarding est 100 % client jusqu'au bout, `POST /api/auth/register`
> est le **premier vrai appel API**. Un backend totalement KO se manifeste donc
> souvent « à la validation du profil » — mais la cause est globale, pas dans register.

---

> **Note sonde** : `/actuator/health` n'existe qu'à partir du build incluant
> Spring Boot Actuator (juillet 2026). Sur un JAR antérieur, sonder plutôt
> `curl -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8080/api/auth/refresh`
> → **401** = backend up (pas de cookie), **000** = down.

## Runbook de diagnostic (à coller sur le VPS)

```bash
echo "==== 1. ÉTAT DU SERVICE ===================================="
sudo systemctl status nutritionIA --no-pager

echo "==== 2. LOGS BACKEND (la cause est quasi toujours ici) ====="
sudo journalctl -u nutritionIA --no-pager -n 150

echo "==== 3. LE BACKEND RÉPOND-IL (en bypassant nginx) ? ========"
curl -sS -o /dev/null -w "backend direct = %{http_code}\n" http://127.0.0.1:8080/actuator/health \
  || echo ">> connexion refusée = backend DOWN"

echo "==== 4. LE 502 VU PAR NGINX (raison + port upstream) ======="
sudo tail -n 30 /var/log/nginx/error.log

echo "==== 5. RESSOURCES / OOM ==================================="
sudo dmesg -T | grep -iE "killed process|out of memory" | tail -5
free -h

echo "==== 6. POSTGRES ==========================================="
docker compose ps 2>/dev/null || docker ps --filter name=nutritionIA-db
```

### Comment lire le résultat

| Symptôme | Cause | Correctif |
|---|---|---|
| §2 : `The following 1 profile is active: "dev"` | `SPRING_PROFILES_ACTIVE=prod` non transmis (EnvironmentFile absent) | brancher l'env, cf. plus bas |
| §2 : `FATAL: password authentication failed` (`28P01`) | mot de passe DB désaligné | aligner `DB_PASSWORD` = mdp du rôle Postgres |
| §2 : `Flyway ... Migration failed` / `checksum mismatch` | migration KO | corriger/ajouter le changeset SQL |
| §2 : `Schema-validation: missing table/column` | dérive de schéma vs entités | migration d'alignement |
| §2 : refus au boot lié à `jwt.secret` | `JWT_SECRET` < 32 car. ou absent | régénérer (`openssl rand -base64 48`) |
| §3 : `000` / connexion refusée + service qui redémarre en boucle | backend crash-loop | cf. §2 pour la cause exacte |
| §4 : `connect() failed (111) ... upstream: 127.0.0.1:XXXX` avec `XXXX ≠ 8080` | nginx pointe le mauvais port | `proxy_pass http://127.0.0.1:8080;` |
| §5 : `killed process ... java` / `free` très bas | OOM (JVM + Postgres se battent pour la RAM) | ajuster `-Xmx`, ajouter du swap |
| §6 : conteneur absent / `unhealthy` | DB down | `docker compose up -d` |

Piège classique : `systemctl is-active` renvoie **active** même quand Spring
plante après le fork (`Type=simple`). Toujours confirmer avec §3 (health direct).

---

## Incident du 07/2026 — post-mortem

**Symptôme** : 502 à la création de compte. **En réalité** : le backend n'avait
**jamais démarré** depuis le déploiement — crash-loop (`restart counter` > 1350).

Trois causes cumulées, toutes dues à une **installation VPS divergente de la
CHECKLIST** :

1. **Profil `dev` au lieu de `prod`** — l'unité systemd déployée (bricolée : `User=ubuntu`,
   workdir `/`, pas d'`EnvironmentFile`) ne transmettait pas `SPRING_PROFILES_ACTIVE`,
   d'où retombée sur `dev` (+ seed de test chargé en prod).
2. **Auth Postgres en échec** (`28P01`) — mot de passe du rôle `gkl` désaligné →
   Flyway ne pouvait pas se connecter → contexte Spring KO → exit 1 → relance.
3. **nginx → port 8000** alors que l'app écoute sur **8080**.

Et le déploiement affichait ✅ vert car son contrôle (`sleep 8 && systemctl
is-active`) est un faux positif (cf. ci-dessus). **Corrigé** : `deploy.yml`
attend désormais un `200` sur `/actuator/health`.

---

## Remise en route propre (Postgres via docker-compose)

Réf. retenue : Postgres en conteneur (comme prévu par `docker-compose.yml`).
Si un Postgres **natif** tourne déjà (port 5432 occupé), il faut le libérer d'abord.

```bash
# 0. (Sécurité) dump de l'éventuel Postgres natif avant de le désactiver
sudo -u postgres pg_dump nutritionAI > ~/nutritionAI-avant-bascule.sql 2>/dev/null || echo "rien à sauvegarder"
sudo systemctl disable --now postgresql   # libère le port 5432

# 1. Docker + le conteneur DB
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo git clone https://github.com/SemihGKL/nutrition_AI.git /opt/nutritionIA/src 2>/dev/null \
  || (cd /opt/nutritionIA/src && sudo git pull)
cd /opt/nutritionIA/src
sudo tee .env >/dev/null <<'ENV'
DB_USERNAME=gkl
DB_PASSWORD=CHOISIS_UN_MDP_FORT
ENV
sudo chmod 600 .env
sudo docker compose up -d
sudo docker compose ps          # attendu : nutritionIA-db  healthy

# 2. Env du backend (profil prod + secrets) — MÊME mdp que le .env docker
sudo mkdir -p /etc/nutritionIA
sudo tee /etc/nutritionIA/nutritionIA.env >/dev/null <<'EOF'
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://localhost:5432/nutritionAI
DB_USERNAME=gkl
DB_PASSWORD=CHOISIS_UN_MDP_FORT
JWT_SECRET=REMPLACE_PAR_32+_CARACTERES
ALLOWED_ORIGINS=http://164.132.103.207
APP_COOKIE_SECURE=false
EOF
sudo chmod 600 /etc/nutritionIA/nutritionIA.env

# 3. Service systemd = celui du repo (fin de la config bricolée)
sudo cp /opt/nutritionIA/src/deploy/nutritionIA.service /etc/systemd/system/
sudo sed -i 's/^User=.*/User=ubuntu/' /etc/systemd/system/nutritionIA.service   # si tu tournes sous ubuntu
sudo systemctl daemon-reload

# 4. nginx : port upstream 8080
sudo grep -rn "127.0.0.1:8000" /etc/nginx/   # trouve le fichier
# éditer -> proxy_pass http://127.0.0.1:8080;
sudo nginx -t && sudo systemctl reload nginx

# 5. Démarrer + vérifier
sudo systemctl restart nutritionIA
sleep 15
sudo journalctl -u nutritionIA -n 40 --no-pager     # attendu : profil "prod", Flyway V1→V15, "Started"
curl -sS -o /dev/null -w "health = %{http_code}\n" http://127.0.0.1:8080/actuator/health   # attendu : 200
```

### Notes

- **`APP_COOKIE_SECURE=false`** est nécessaire **tant qu'on est en HTTP sur une IP** :
  en prod le cookie `refresh_token` est `Secure` et serait ignoré par le navigateur
  sans HTTPS. Repasser à `true` une fois le **domaine + TLS** en place (CHECKLIST §7).
- **Source de vérité** : sur le VPS, utiliser les fichiers `deploy/*.service` et
  `deploy/nginx-*.conf` **du repo** (via `cp`), ne pas les éditer à la main — sinon
  ils redivergent et on rejoue cet incident.
- **Sauvegardes** : le volume docker `postgres_data` n'a aucune redondance. Mettre
  en place le `pg_dump` planifié (CHECKLIST §11).
