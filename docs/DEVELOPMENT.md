# Environnement de développement

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Java 17
- Maven (ou utiliser le wrapper `./mvnw`)

---

## Démarrage rapide

```bash
# 1. Lancer la base de données
docker compose up -d

# 2. Lancer le backend (depuis backend/)
./mvnw spring-boot:run
```

Flyway applique automatiquement les migrations SQL au démarrage. L'API est disponible sur `http://localhost:8080`.

---

## Base de données

PostgreSQL 16 tourne dans un container Docker.

| Paramètre | Valeur |
|-----------|--------|
| Host | `localhost:5432` |
| Base | `nutritionAI` |
| User | `gkl` |
| Password | `REMOVED` |

### Commandes utiles

```bash
docker compose up -d        # Démarrer (données conservées)
docker compose down         # Arrêter (données conservées)
docker compose down -v      # Arrêter + effacer toutes les données (reset complet)
docker compose logs db      # Voir les logs PostgreSQL
```

---

## Migrations Flyway

Les fichiers SQL sont dans `backend/src/main/resources/db/migration/`.

Flyway les applique **automatiquement** au démarrage de Spring Boot, dans l'ordre des versions.

### Convention de nommage

```
V{numéro}__{description}.sql

Exemples :
V1__create_tables.sql
V2__add_steps_and_calories_burned.sql
V3__create_weekly_weighin.sql
```

### Règles à respecter

- **Ne jamais modifier** un fichier de migration déjà appliqué — Flyway vérifie le checksum et refusera de démarrer
- **Toujours créer** un nouveau fichier pour chaque changement de schéma
- Les descriptions sont en snake_case, claires et concises

### Historique des migrations

| Version | Description |
|---------|-------------|
| V1 | Création des tables `users` et `daily_calories` |

### Reset complet du schéma

```bash
docker compose down -v   # Efface le volume PostgreSQL
docker compose up -d     # Recrée la base vide
./mvnw spring-boot:run   # Flyway rejoue toutes les migrations depuis V1
```

---

## Tests

```bash
# Depuis backend/
./mvnw test                              # Tous les tests
./mvnw test -Dtest=MbrCalculatorTest    # Un test spécifique
```

Les tests du domaine (`domain/`) sont des tests unitaires purs — pas besoin de base de données.

---

## Structure du projet

```
nutritionIA/
├── docker-compose.yml          ← Base de données PostgreSQL
├── SPECS.md                    ← Spécifications fonctionnelles
├── CLAUDE.md                   ← Guide pour l'assistant IA
├── docs/
│   └── DEVELOPMENT.md          ← Ce fichier
└── backend/
    ├── src/main/java/com/nutrition/backend/
    │   ├── domain/             ← Logique métier pure (aucune dépendance framework)
    │   │   ├── model/          ← Value Objects, enums (Gender, ActivityLevel, Mbr, UserProfile)
    │   │   └── service/        ← Domain services (MbrCalculator)
    │   ├── Class/              ← Entités JPA (User, DailyCalories)
    │   ├── Service/            ← Services applicatifs
    │   ├── Repository/         ← Interfaces Spring Data
    │   ├── Controller/         ← Contrôleurs REST
    │   └── Exception/          ← Exceptions métier
    └── src/main/resources/
        ├── application.properties       ← Profil actif : dev
        ├── application-dev.properties   ← Config développement
        └── db/migration/               ← Scripts SQL Flyway
            └── V1__create_tables.sql
```
