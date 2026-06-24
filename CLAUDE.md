# NutritionIA — CLAUDE.md

## Project overview

PWA de suivi calorique avec assistance IA. L'utilisateur saisit ses calories quotidiennes, son poids hebdomadaire, et obtient un récapitulatif généré par Claude AI (Anthropic) avec des recommandations personnalisées.

**État actuel** : backend Spring Boot en cours de construction. Frontend React et intégration Claude AI à venir.

---

## Stack

| Couche | Technologie |
|---|---|
| Backend | Java 17 + Spring Boot 3.3.5 (Maven) |
| Base de données | PostgreSQL + Liquibase (migrations) |
| Frontend | React + Vite — **à créer** |
| IA | Claude API (Anthropic) — **à intégrer** |
| Auth | Spring Security + JWT — **à implémenter** |
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
infrastructure/  (Spring, JPA, REST, Liquibase)
    ↓
adapters/        (Controllers, JPA Repositories)
    ↓
application/     (Use Cases, Ports)
    ↓
domain/          (Entités, Value Objects, Domain Services)
```

### Etat actuel du code (dette architecturale)

Le code existant **ne respecte pas encore** la Clean Architecture — c'est la migration à réaliser :

| Package actuel | Problème | Cible |
|---|---|---|
| `Class/` | JPA annotations dans le "domaine" | `domain/` pur, `infrastructure/` pour JPA |
| `Service/` | Services anémiques, pas de use cases | `application/usecases/` |
| `Repository/` | Interfaces Spring Data dans le domaine | `domain/ports/` + `infrastructure/adapters/` |
| `Controller/` | Logique métier possible dans les controllers | `infrastructure/web/` uniquement adaptateurs |

**Ne pas aggraver la dette** : tout nouveau code suit la cible. La migration de l'existant se fait progressivement avec des tests.

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
- **WeeklyWeighIn** : pesée hebdomadaire (à créer)

---

## Migrations Liquibase

Les fichiers sont dans `backend/src/main/resources/db/changelog/versions/`.
- `changeset-v1.0.xml` — tables `users` et `daily_calories`
- `changeset-v1.1.xml` — colonnes `start_weight`, `current_weight`

**Règle** : toute modification de schéma = nouveau fichier `changeset-vX.Y.xml`, jamais de modification d'un changeset existant.

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

## Endpoints existants

```
GET  /api/users/{id}                   ✅
GET  /api/daily/{userId}?date=         ✅
GET  /api/daily/{userId}/all           ✅
```

### À implémenter (Phase 1)
```
POST /api/auth/register
POST /api/auth/login
PUT  /api/users/{id}
POST /api/users/{id}/recalculate-mbr
POST /api/daily
PUT  /api/daily/{id}/confirm
POST /api/weighin
GET  /api/weighin/{userId}
GET  /api/weighin/{userId}/latest
GET  /api/recap/{userId}/week?date=
POST /api/ai/recap
```

---

## Priorités de développement

1. **Phase 1** — Compléter le backend : `password`/`startWeight`/`currentWeight` sur User, `steps`/`caloriesBurned` sur DailyCalories, entité `WeeklyWeighIn`, Spring Security + JWT, calcul MBR/TDEE
2. **Phase 2** — Intégration Claude AI (`AiService`, endpoint `/api/ai/recap`)
3. **Phase 3** — Frontend React + Vite (Login / Onboarding / Dashboard / Profil / Récap)
4. **Phase 4** — Déploiement (Railway backend + Vercel frontend)

---

## Workflow TDD obligatoire

Tout nouveau code passe par le cycle RED → GREEN → REFACTOR. Utiliser `/tdd` pour les use cases et adapters. Les tests sont écrits **avant** le code de production, sans exception.