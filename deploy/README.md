# Déploiement VPS — NutritionIA

Topologie : **une seule machine**. Backend Spring Boot en service `systemd`, front
statique servi par **nginx** (même origine), Postgres en conteneur Docker.

```
Internet ──HTTPS──▶ nginx ─┬─ /            → /var/www/nutritionIA (front build)
                           └─ /api/        → 127.0.0.1:8080 (backend systemd)
                                                    │
                                                    ▼
                                       Postgres (Docker, 127.0.0.1:5432)
```

## Fichiers de ce dossier

| Fichier | Destination sur le VPS | Rôle |
|---|---|---|
| `nutritionIA.service` | `/etc/systemd/system/` | Lance le JAR avec le profil `prod` + secrets + heap borné |
| `nutritionIA.env.example` | `/etc/nutritionIA/nutritionIA.env` (rempli, `chmod 600`) | Profil `prod`, DB, `JWT_SECRET`, SMTP (`MAIL_*`), `APP_BASE_URL` |
| `nginx-nutritionIA.conf` | `/etc/nginx/sites-available/` | Front statique + proxy `/api` même origine |
| `release.sh` | `/opt/nutritionIA/` (déposé par la CI) | Mise en ligne : bascule du JAR, sonde readiness, publication du front, retour arrière automatique |
| `release-version.sh` | (exécuté par la CI) | Numéro de version +0.1 calculé depuis `main`, commit de release |
| `tests/*.test.sh` | — | Tests des deux scripts (faux VPS, faux dépôt distant), lancés en CI |

## Étapes

1. **Base de données** (à la racine du repo, avec un `.env` rempli) :
   ```bash
   docker compose up -d
   ```
   Le port est publié sur `127.0.0.1:5432` uniquement — jamais exposé à Internet.

2. **Env + service backend** :
   ```bash
   sudo mkdir -p /etc/nutritionIA
   sudo cp deploy/nutritionIA.env.example /etc/nutritionIA/nutritionIA.env
   sudo chmod 600 /etc/nutritionIA/nutritionIA.env    # puis remplir les vraies valeurs
   sudo cp deploy/nutritionIA.service /etc/systemd/system/
   sudo systemctl daemon-reload && sudo systemctl enable --now nutritionIA
   ```

3. **nginx + TLS** :
   ```bash
   sudo cp deploy/nginx-nutritionIA.conf /etc/nginx/sites-available/nutritionIA
   sudo ln -s /etc/nginx/sites-available/nutritionIA /etc/nginx/sites-enabled/
   sudo certbot --nginx -d votre-domaine.fr
   sudo nginx -t && sudo systemctl reload nginx
   ```

## ⚠️ Sauvegardes (à mettre en place — non couvert par le déploiement)

Toutes les données vivent dans le volume Docker `postgres_data`. **Aucune redondance.**
Mettre en place un `pg_dump` planifié copié hors-VPS, par ex. dans une crontab root :

```bash
0 3 * * * docker exec nutritionIA-db pg_dump -U gkl nutritionAI | gzip > /var/backups/nutritionAI-$(date +\%F).sql.gz
```

(et synchroniser `/var/backups` vers un stockage externe).

## Reprise des totaux effacés (bug v0.2.0 → v0.4.0)

Jusqu'à la v0.4.0, modifier les pas, la séance ou confirmer une **ancienne** saisie (total
direct, sans détail par repas) remettait son total à 0 en base. Corrigé en v0.5.0 ; les totaux
déjà effacés se reprennent d'une sauvegarde faite **avant** la perte, depuis le clone du dépôt
sur le VPS (`cd /opt/nutritionIA/src && git pull`), **après** le déploiement de la v0.5.0 :

```bash
bash deploy/restore-legacy-totals.sh /var/backups/nutritionAI-2026-10-01.sql.gz          # simulation
bash deploy/restore-legacy-totals.sh /var/backups/nutritionAI-2026-10-01.sql.gz --apply  # restauration
```

- Seuls les jours **aujourd'hui vides** (total et repas à 0) qui étaient une ancienne saisie
  avec un total dans la sauvegarde sont restaurés ; tout ce qui a été saisi depuis est conservé.
  Relançable sans risque. Comptes rapprochés par email.
- Dump SQL attendu (`.sql` / `.sql.gz`) ; un dump au format personnalisé se convertit avec
  `pg_restore -f sauvegarde.sql <fichier>`.
- Connexion par défaut : `docker exec -i nutritionIA-db psql -U gkl -d nutritionAI`, à adapter
  via `PSQL=…` (ex. `PSQL="sudo docker exec -i nutritionIA-db psql -U gkl -d nutritionAI"`).
