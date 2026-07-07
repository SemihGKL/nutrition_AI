# NutritionIA — CLAUDE.md

## Project overview

PWA de suivi calorique. L'utilisateur saisit ses calories quotidiennes, son poids hebdomadaire, et suit sa progression via un dashboard et des récapitulatifs hebdomadaires.

**État actuel** : backend Spring Boot et frontend React + Vite complets. Prochaine étape : déploiement.

---

## Stack

| Couche | Technologie |
|---|---|
| Backend | Java 17 + Spring Boot 3.3.5 (Maven) |
| Base de données | PostgreSQL + Flyway (migrations) |
| Frontend | React + Vite |
| Auth | Spring Security + JWT |
| Tests | JUnit 5 + Mockito |

---

## Commandes essentielles

```bash
# Depuis backend/
./mvnw spring-boot:run                  # Démarrer le backend (profil dev)
./mvnw test                             # Lancer tous les tests
./mvnw test -Dtest=UserServiceTest      # Lancer un test spécifique
./mvnw clean package -DskipTests       # Build sans tests
```

**Prérequis** : PostgreSQL local sur `localhost:5432`, base `nutritionAI`, user `gkl`.

---

## Architecture cible — Clean Architecture

Les règles d'architecture sont dans `.claude/rules/ARCHITECTURE.md`. Respecter **strictement** la règle de dépendance : les dépendances pointent vers l'intérieur.

```
infrastructure/  (Spring, JPA, REST, Flyway)
    ↓
adapters/        (Controllers, JPA Repositories)
    ↓
application/     (Use Cases, Ports)
    ↓
domain/          (Entités, Value Objects, Domain Services)
```

La Clean Architecture est en place et respectée. Tout nouveau code doit maintenir la règle de dépendance.

---

## Domaine métier

### Formule MBR (Mifflin-St Jeor)
```
Homme : MBR = (10 × poids_kg) + (6.25 × taille_cm) − (5 × âge) + 5
Femme : MBR = (10 × poids_kg) + (6.25 × taille_cm) − (5 × âge) − 161
TDEE  = MBR × 1.2 (sédentaire de base)
```

Le TDEE utilise le coefficient sédentaire (1.2). Les calories brûlées par l'activité sportive sont comptabilisées dynamiquement via les objectifs de type SPORT renseignés par l'utilisateur (calories brûlées saisies dans l'entrée quotidienne).

**Déficit recommandé** : 300–500 kcal/jour sous le TDEE.

### Agrégats principaux

- **User** : profil complet (MBR, TDEE, objectif calorique)
- **DailyCalories** : saisie journalière (kcal, pas, kcal brûlées, confirmation)
- **WeeklyWeighIn** : pesée hebdomadaire

---

## Migrations Flyway

Les fichiers sont dans `backend/src/main/resources/db/migration/`.
- `V1__create_tables.sql` — tables `users` et `daily_calories`
- `V2` → `V14` — colonnes supplémentaires, contraintes, refresh tokens, etc.

**Règle** : toute modification de schéma = nouveau fichier `V{N+1}__description.sql`, jamais de modification d'un fichier existant. Prochaine migration : `V15`.

---

## Conventions de code

### Nommage des tests
```java
// Classe : [ClassUnderTest]Test
// Méthode : should_[resultat_attendu]_when_[condition]
void should_return_user_when_id_exists() {}
void should_throw_exception_when_user_not_found() {}
```

### Ce qui est interdit (voir `.claude/rules/`)
- Annotations JPA dans le domaine
- `null` — utiliser `Optional`
- Getters/setters sans test qui les exige
- Validation défensive sans test
- Logique métier dans les controllers
- Dépendances vers les couches extérieures depuis le domaine

---

## Endpoints implémentés

```
POST /api/auth/register                ✅
POST /api/auth/login                   ✅
POST /api/auth/refresh                 ✅
POST /api/auth/logout                  ✅
GET  /api/users/{id}                   ✅
PUT  /api/users/{id}                   ✅
GET  /api/daily-kcal                   ✅
GET  /api/daily-kcal/{date}            ✅
POST /api/daily-kcal                   ✅
GET  /api/daily-kcal/{date}/recap      ✅
GET  /api/weighin                      ✅
GET  /api/weighin/latest               ✅
POST /api/weighin                      ✅
GET  /api/objectives                   ✅
POST /api/objectives                   ✅
DELETE /api/objectives/{id}            ✅
POST /api/objectives/{id}/completions/{date}   ✅
DELETE /api/objectives/{id}/completions/{date} ✅
GET  /api/objectives/completions       ✅
```

---

## Priorités de développement

1. ~~Phase 1 — Backend~~ ✅
2. ~~Phase 2 — Intégration IA~~ — abandonnée
3. ~~Phase 3 — Frontend React + Vite~~ ✅
4. **Phase 4** — Déploiement (Railway backend + Vercel frontend)

---

## Workflow TDD obligatoire

Tout nouveau code passe par le cycle RED → GREEN → REFACTOR. Utiliser `/tdd` pour les use cases et adapters. Les tests sont écrits **avant** le code de production, sans exception.