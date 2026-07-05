# Checklist de mise en place du VPS

À faire **une seule fois** sur le VPS avant le premier déploiement. Le workflow
`deploy.yml` ne fait QUE : build JAR + front → `scp` vers le VPS → `systemctl restart`.
Il **n'installe ni la base, ni les secrets, ni le service, ni nginx** — c'est le rôle
de cette checklist.

> ⚠️ Tant que les étapes 1→8 ne sont pas faites, merger dans `main` déploiera « dans le vide » (étape `deploy` rouge, sans danger).

Variables utilisées ci-dessous :
- `DEPLOY_USER` = l'utilisateur SSH de déploiement (celui des secrets GitHub)
- `DOMAIN` = ton domaine pointant vers le VPS (ex. `kaloriim.fr`)

---

## 0. Prérequis
- [ ] VPS Ubuntu (OVH) avec accès `sudo`.
- [ ] Un **domaine** dont l'enregistrement A pointe vers l'IP du VPS (nécessaire pour le TLS + le cookie `Secure`).
- [ ] Accès SSH par clé pour `DEPLOY_USER`.

## 1. Secrets GitHub (repo → Settings → Secrets and variables → Actions)
- [ ] `VPS_HOST` = IP ou hostname du VPS
- [ ] `VPS_USER` = `DEPLOY_USER`
- [ ] `VPS_SSH_KEY` = **clé privée** dont la publique est dans `~DEPLOY_USER/.ssh/authorized_keys` sur le VPS

## 2. Paquets de base (sur le VPS)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-17-jre-headless nginx git curl \
     docker.io docker-compose-plugin certbot python3-certbot-nginx
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # se reconnecter ensuite
```

## 3. Dossiers
```bash
sudo mkdir -p /opt/nutritionIA /var/www/nutritionIA /etc/nutritionIA
# DEPLOY_USER doit pouvoir écrire (scp) dans /opt/nutritionIA et /var/www/nutritionIA :
sudo chown -R $DEPLOY_USER:$DEPLOY_USER /opt/nutritionIA /var/www/nutritionIA
```
- [ ] Dossiers créés, `DEPLOY_USER` propriétaire de `/opt/nutritionIA` et `/var/www/nutritionIA`.

> **Décision utilisateur du service** : le plus simple est de faire tourner le
> backend sous `DEPLOY_USER` (il possède déjà le JAR). Dans `nutritionIA.service`,
> mets `User=DEPLOY_USER`. (Alternative : créer un user dédié `nutritionia` et lui
> donner le droit de lecture sur `/opt/nutritionIA` + accès au socket/port DB.)

## 4. Base de données Postgres (Docker) — NON gérée par deploy.yml
```bash
# Récupérer docker-compose.yml sur le VPS (clone du repo, ou scp du fichier) :
sudo git clone https://github.com/SemihGKL/nutrition_AI.git /opt/nutritionIA/src
cd /opt/nutritionIA/src

# Créer le .env attendu par docker-compose (à la racine, à côté du yml) :
cat > .env <<'ENV'
DB_USERNAME=gkl
DB_PASSWORD=<mot_de_passe_fort>
ENV
chmod 600 .env

docker compose up -d
```
- [ ] Conteneur `nutritionIA-db` **healthy** : `docker compose ps`
- [ ] Port **bindé sur la loopback uniquement** : `ss -ltnp | grep 5432` → doit montrer `127.0.0.1:5432` (jamais `0.0.0.0`)

## 5. Secrets du backend (`/etc/nutritionIA/nutritionIA.env`)
```bash
sudo cp /opt/nutritionIA/src/deploy/nutritionIA.env.example /etc/nutritionIA/nutritionIA.env
sudo nano /etc/nutritionIA/nutritionIA.env      # remplir les vraies valeurs
sudo chmod 600 /etc/nutritionIA/nutritionIA.env
```
Contenu attendu :
```
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://localhost:5432/nutritionAI
DB_USERNAME=gkl
DB_PASSWORD=<le_MÊME_que_le_.env_docker>
JWT_SECRET=<≥ 32 caractères — openssl rand -base64 48>
ALLOWED_ORIGINS=https://DOMAIN
```
- [ ] `SPRING_PROFILES_ACTIVE=prod` (sinon retombée sur `dev` → seed de test en prod !)
- [ ] `DB_USERNAME`/`DB_PASSWORD` **identiques** au `.env` de docker-compose (étape 4)
- [ ] `JWT_SECRET` ≥ 32 caractères (sinon l'app refuse de démarrer)

## 6. Service systemd
```bash
sudo cp /opt/nutritionIA/src/deploy/nutritionIA.service /etc/systemd/system/
sudo nano /etc/systemd/system/nutritionIA.service   # ajuster User= si besoin (cf. étape 3)
sudo systemctl daemon-reload
sudo systemctl enable nutritionIA        # ne pas start maintenant : le JAR n'existe qu'après le 1er deploy
```
- [ ] Unité installée, `EnvironmentFile=/etc/nutritionIA/nutritionIA.env`, `enable` OK.

**Sudo sans mot de passe pour le déploiement** (deploy.yml fait `sudo systemctl restart`) :
```bash
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nutritionIA, /usr/bin/systemctl is-active nutritionIA, /usr/bin/journalctl -u nutritionIA *" \
  | sudo tee /etc/sudoers.d/nutritionIA
sudo chmod 440 /etc/sudoers.d/nutritionIA
sudo visudo -c    # vérifier la syntaxe (adapter le chemin si systemctl est dans /bin)
```
- [ ] `DEPLOY_USER` peut faire `sudo systemctl restart nutritionIA` sans mot de passe.

## 7. nginx + TLS (même origine : sert le front + proxifie /api)
```bash
sudo cp /opt/nutritionIA/src/deploy/nginx-nutritionIA.conf /etc/nginx/sites-available/nutritionIA
sudo nano /etc/nginx/sites-available/nutritionIA        # remplacer votre-domaine.fr par DOMAIN
sudo ln -s /etc/nginx/sites-available/nutritionIA /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo certbot --nginx -d DOMAIN
sudo nginx -t && sudo systemctl reload nginx
```
- [ ] `https://DOMAIN` répond, certificat valide.
- [ ] `X-Forwarded-Proto` bien transmis (déjà dans le conf) → cookie `Secure` OK.

## 8. Pare-feu
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'    # 80 + 443
sudo ufw enable
```
- [ ] 22/80/443 ouverts. **5432 non exposé** (bindé loopback à l'étape 4 — ne pas l'ouvrir).

---

## 9. Premier déploiement
- [ ] Étapes 1→8 terminées.
- [ ] Merger la **PR #1** (`develop → main`) — ou `git push origin develop:main` — déclenche `deploy.yml`.
- [ ] Suivre l'Action GitHub : job `test` (dont les 6 tests Testcontainers) → puis `deploy` (scp + restart + `is-active`).
- [ ] Sur le VPS : `sudo journalctl -u nutritionIA -f` pendant le redémarrage (voir Flyway migrer V1→V14 puis le démarrage Spring).

## 10. Vérifications post-déploiement (smoke test)
- [ ] `sudo systemctl is-active nutritionIA` → `active`
- [ ] `curl -sS https://DOMAIN/ | head` → l'index du front
- [ ] Inscription via l'UI, connexion, saisie d'un jour, pesée → fonctionne
- [ ] En base : `docker exec -it nutritionIA-db psql -U gkl -d nutritionAI -c "\dt"` → tables présentes ; `flyway_schema_history` va jusqu'à **V14**
- [ ] Le seed de test (`testuser@example.com`) **n'existe PAS** (confirme le profil `prod`)

## 11. Sauvegardes (V2) — à ne pas oublier
```bash
# crontab -e (root)
0 3 * * * docker exec nutritionIA-db pg_dump -U gkl nutritionAI | gzip > /var/backups/nutritionAI-$(date +\%F).sql.gz
```
- [ ] `pg_dump` planifié + `/var/backups` synchronisé **hors VPS** (sinon perte totale si le disque lâche).

---

## Rappels / pièges
- `deploy.yml` ne touche PAS à la DB / aux secrets / au service / à nginx → tout ça = étapes 4→8, manuelles, une fois.
- `JWT_SECRET` < 32 car. → l'app ne démarre pas.
- `DB_USERNAME`/`DB_PASSWORD` doivent être identiques entre le `.env` docker et `nutritionIA.env`.
- Reboot du VPS : Postgres revient (`restart: unless-stopped`), et le backend retente au démarrage (`Restart=on-failure`).
- Mettre à jour le code sur le VPS pour docker-compose : `cd /opt/nutritionIA/src && git pull` avant un `docker compose up -d` si le compose change.
