# NutritionIA — Spécifications du projet

## Vue d'ensemble

Application web (PWA) de suivi calorique avec assistance IA permettant à l'utilisateur de :
- Suivre son apport calorique quotidien
- Calculer et recalculer son MBR (Métabolisme de Base au Repos)
- Suivre son déficit ou surplus calorique
- Corréler son évolution de poids avec ses habitudes alimentaires
- Obtenir des recommandations personnalisées via Claude AI (Anthropic)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Java 17 + Spring Boot (Maven) — **déjà initié** |
| Base de données | PostgreSQL + Liquibase (migrations) — **déjà initié** |
| Frontend | React + Vite (Web App / PWA) — **à créer** |
| IA | Claude API (Anthropic) — **à intégrer** |
| Auth | JWT (Spring Security) — **à implémenter** |
| Hébergement | Vercel (frontend) + Railway/Render (backend) |

---

## Formule MBR — Mifflin-St Jeor

```
Homme : MBR = (10 × poids en kg) + (6.25 × taille en cm) − (5 × âge) + 5
Femme : MBR = (10 × poids en kg) + (6.25 × taille en cm) − (5 × âge) − 161
```

**TDEE (dépense totale journalière)** = MBR × coefficient d'activité

| Niveau d'activité | Coefficient |
|---|---|
| Sédentaire (peu ou pas de sport) | 1.2 |
| Légèrement actif (1-3j/semaine) | 1.375 |
| Modérément actif (3-5j/semaine) | 1.55 |
| Très actif (6-7j/semaine) | 1.725 |
| Extrêmement actif (sportif pro) | 1.9 |

**Déficit recommandé** : 300 à 500 kcal/jour sous le TDEE pour une perte de poids saine.

---

## Modèles de données

### Existant

#### `User`
| Champ | Type | Statut |
|---|---|---|
| id | Long | ✅ |
| username | String | ✅ |
| email | String | ✅ |
| gender | String | ✅ |
| age | int | ✅ |
| height | double | ✅ |
| activityLevel | String | ✅ |
| dailyCalorieGoal | int | ✅ |
| weightGoal | int | ✅ |
| password (hashé) | String | ❌ à ajouter |
| startWeight | double | ❌ à ajouter (migration v1.1 existe en DB) |
| currentWeight | double | ❌ à ajouter (migration v1.1 existe en DB) |

#### `DailyCalories`
| Champ | Type | Statut |
|---|---|---|
| id | Long | ✅ |
| date | LocalDate | ✅ |
| caloriesConsumed | int | ✅ |
| isConfirmed | boolean | ✅ |
| user (FK) | User | ✅ |
| steps | int (optionnel) | ❌ à ajouter |
| caloriesBurned | int (optionnel) | ❌ à ajouter |

### À créer

#### `WeeklyWeighIn`
| Champ | Type | Description |
|---|---|---|
| id | Long | PK |
| user | User (FK) | Propriétaire |
| date | LocalDate | Date de la pesée |
| weight | double | Poids en kg |
| note | String (optionnel) | Commentaire libre |

---

## Fonctionnalités

### 1. Authentification
- Inscription : username, email, password
- Connexion : email + password → JWT
- Pas de OAuth pour l'instant (simple et rapide)

### 2. Onboarding (première connexion)
Saisie des informations de profil :
- Âge, taille, poids de départ, genre
- Fréquence de sport / niveau d'activité
- Calcul automatique du MBR + TDEE + objectif calorique suggéré
- L'utilisateur peut ajuster l'objectif calorique proposé

### 3. Tableau de bord quotidien
Interface principale (minimaliste) :
- Saisie des **kcal consommées** dans la journée (obligatoire)
- Saisie du **nombre de pas** (optionnel)
- Saisie des **kcal brûlées** par le sport ou activité (optionnel)
- Affichage du **bilan du jour** : consommé vs objectif → déficit ou surplus
- Confirmation de fin de journée (champ `isConfirmed`)

### 4. Pesée hebdomadaire
- L'utilisateur enregistre son poids une fois par semaine
- L'app compare avec la pesée précédente (ou le poids de départ)
- Le `currentWeight` du profil est mis à jour à chaque pesée
- Le `startWeight` reste figé à l'inscription

### 5. Récapitulatif hebdomadaire
Généré automatiquement chaque fin de semaine :
- Total kcal consommées sur 7 jours
- Déficit/surplus calorique moyen
- Évolution du poids vs pesée précédente
- Cohérence entre déficit estimé et perte réelle
- **Résumé IA via Claude** : analyse de la semaine + recommandations

### 6. Recalcul du MBR
- Disponible depuis le profil à tout moment
- L'utilisateur met à jour poids actuel, activité, âge si nécessaire
- Recalcul du TDEE et proposition d'un nouvel objectif calorique
- Historique des recalculs (date + nouvelles valeurs)

### 7. Intégration Claude AI
**Endpoint dédié côté backend** — appels à l'API Anthropic pour :
- Générer la guideline de déficit calorique à l'inscription
- Produire le récapitulatif hebdomadaire commenté
- Répondre à des questions ponctuelles de l'utilisateur (optionnel v2)

---

## Endpoints API à construire

### Auth
- `POST /api/auth/register` — inscription
- `POST /api/auth/login` — connexion → JWT

### User
- `GET /api/users/{id}` — profil utilisateur ✅ (existe)
- `PUT /api/users/{id}` — mise à jour du profil
- `POST /api/users/{id}/recalculate-mbr` — recalcul MBR

### Daily Calories
- `POST /api/daily` — saisie du jour
- `GET /api/daily/{userId}?date=` — données d'un jour ✅ (existe)
- `GET /api/daily/{userId}/all` — tout l'historique ✅ (existe)
- `PUT /api/daily/{id}/confirm` — confirmation fin de journée

### Weekly Weigh-In
- `POST /api/weighin` — enregistrer une pesée
- `GET /api/weighin/{userId}` — historique des pesées
- `GET /api/weighin/{userId}/latest` — dernière pesée

### Récapitulatif
- `GET /api/recap/{userId}/week?date=` — récap hebdomadaire
- `POST /api/ai/recap` — génération du résumé IA

---

## Priorités de développement

### Phase 1 — Backend (compléter ce qui existe)
1. Ajouter `password`, `startWeight`, `currentWeight` à l'entité User
2. Ajouter `steps`, `caloriesBurned` à DailyCalories
3. Créer l'entité `WeeklyWeighIn`
4. Implémenter Spring Security + JWT
5. Implémenter le calcul MBR/TDEE dans `UserService`
6. Créer les migrations Liquibase correspondantes

### Phase 2 — Intégration Claude AI
1. Ajouter la dépendance Anthropic SDK (ou appel HTTP)
2. Créer `AiService` avec prompt engineering pour les recommandations
3. Exposer l'endpoint `/api/ai/recap`

### Phase 3 — Frontend React
1. Pages : Login / Register / Onboarding / Dashboard / Profil / Récap
2. Connexion avec le backend via API REST
3. Configuration PWA (installable sur mobile)

### Phase 4 — Déploiement
1. Backend sur Railway ou Render (gratuit pour démarrer)
2. Frontend sur Vercel
3. Base de données PostgreSQL sur Railway

---

## Ce qui est déjà fait (backend)

- Structure Spring Boot avec Maven
- Entités `User` et `DailyCalories` avec JPA
- Services : `UserService`, `DailyCaloriesService`
- Repositories : `UserRepository`, `DailyCaloriesRepository`
- Exception `UserNotFoundException`
- Migrations Liquibase v1.0 et v1.1
- Configuration multi-environnement (`application-dev.properties`)
