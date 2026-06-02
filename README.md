# NutritionIA

PWA de suivi calorique avec assistance IA.

---

## Prérequis

- Java 17+
- Maven (ou utiliser `./mvnw`)
- Node.js 20+
- Docker

---

## Base de données

```bash
# Démarrer PostgreSQL via Docker
docker compose up -d

# Arrêter
docker compose down

# Arrêter et supprimer les données
docker compose down -v
```

Connexion : `localhost:5432` — base `nutritionAI`, user `gkl`, password `REMOVED`

---

## Backend

```bash
cd backend

# Démarrer (profil dev)
./mvnw spring-boot:run

# Lancer les tests
./mvnw test

# Build sans tests
./mvnw clean package -DskipTests
```

API disponible sur `http://localhost:8080`

---

## Frontend

```bash
cd frontend

# Installer les dépendances (première fois)
npm install

# Démarrer en dev
npm run dev

# Build de production
npm run build
```

Interface disponible sur `http://localhost:5173`

---

## Ordre de démarrage

1. `docker compose up -d` — base de données
2. `./mvnw spring-boot:run` — backend
3. `npm run dev` — frontend
