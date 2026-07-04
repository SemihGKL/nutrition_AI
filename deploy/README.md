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
| `nutritionIA.env.example` | `/etc/nutritionIA/nutritionIA.env` (rempli, `chmod 600`) | Profil `prod`, DB, `JWT_SECRET` |
| `nginx-nutritionIA.conf` | `/etc/nginx/sites-available/` | Front statique + proxy `/api` même origine |

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
