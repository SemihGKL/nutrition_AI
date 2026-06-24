# TDD Analysis — Use Cases sans couverture de tests unitaires

**Test Type:** UNIT (logique métier pure, pas d'HTTP ni de base de données)

**Feature Area:** `backend/src/main/java/com/nutrition/backend/application/usecase/`

**Bounded Context:** backend Spring Boot — couche application

---

## Contexte d'exploration

### Modèles de domaine identifiés

- `User` — entité immuable avec wither methods (`withBodyMetrics`, `withDailyCalorieGoal`, `withCurrentWeight`, `withEmail`, `withDailyStepsGoal`)
- `DailyEntry` — entrée journalière (caloriesConsumed, steps, caloriesBurned, confirmed)
- `WeightEntry` — pesée (userId, date, weight, note)
- `Gender` — enum MALE / FEMALE
- `UserProfile` — record (weightKg, heightCm, age, gender) utilisé pour le calcul MBR
- `Mbr` — record (mbr, tdee, dailyCalorieGoal) avec méthode `deficitPercentage(int)`

### Ports (interfaces)

- `UserRepository` — save, findById, findByEmail, findAll
- `DailyEntryRepository` — save, findByUserIdAndDate, findByUserId
- `WeightEntryRepository` — save, findByUserIdOrderByDateDesc
- `PasswordEncoderPort` — encode, matches

### Domain services

- `MbrCalculator.calculate(UserProfile)` — formule Mifflin-St Jeor, TDEE × 1.2 sédentaire, dailyCalorieGoal = arrondi au multiple de 50 le plus proche de (MBR − 200)
- `StepsCalculator.toKcal(steps, weightKg)` — soustraction du plancher de 4 000 pas, proportionnel au poids (base 70 kg), × 0.025

### Fakes existants à créer

Aucun fake in-memory n'existe dans la codebase de test. Ils sont à créer pour chaque use case.

### Convention de nommage observée (fichiers tdd.md précédent + CLAUDE.md)

- Méthodes de test : `should_[résultat]_when_[condition]` en snake_case
- Classes de test : `[ClassUnderTest]Test`
- Framework : JUnit 5 `@Test`, AssertJ `assertThat()`
- Doubles : fakes in-memory à la main (pas de Mockito pour les domaines propres)

---

## Use Case 1 — `RegisterUserUseCase`

### Logique non triviale

1. Le `dailyCalorieGoal` stocké sur l'User est calculé par MBR, pas le `weightGoal` passé en paramètre — le `weightGoal` est un objectif de poids (en kg), le `dailyCalorieGoal` est la cible calorique journalière issue de la formule Mifflin-St Jeor.
2. `currentWeight` est initialisé à `startWeight` à l'inscription.
3. Le mot de passe est encodé avant persistance.

### Liste de tests ordonnés (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should assign the MBR-derived calorie goal to the new user when registering with body metrics | nil → constant (2) | Baseline — peut être satisfait en retournant un User avec une constante dailyCalorieGoal | ✅ GREEN |
| 2 | should assign a different MBR-derived calorie goal when registering a female user with the same body metrics as a male user | unconditional → conditional (4) | La constante du test 1 (calculée pour MALE) est fausse pour FEMALE → force une branche sur le genre dans MbrCalculator | ✅ GREEN |
| 3 | should initialize current weight equal to start weight when registering a new user | constant → variable (3) | Le currentWeight doit refléter le startWeight fourni, pas une valeur fixe → force l'usage de la variable startWeight | ✅ GREEN |
| 4 | should store the encoded password and not the raw password when registering a new user | unconditional → conditional (4) | Le test précédent laisse le rawPassword tel quel → force l'appel à passwordEncoder.encode() | ✅ GREEN |

### Fichiers à créer

- `backend/src/test/java/com/nutrition/backend/application/usecase/RegisterUserUseCaseTest.java`
- (fakes inline dans le test ou dans un sous-package `fake/`) — `FakeUserRepository`, `FakePasswordEncoder`

---

## Use Case 2 — `LoginUserUseCase`

### Logique non triviale

Deux chemins d'erreur distincts avec des messages différents. Pas de calcul, mais deux invariants métier fondamentaux de sécurité (email inconnu vs mot de passe incorrect). Il serait dangereux de les confondre.

### Liste de tests ordonnés (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should return the authenticated user when email and password are both correct | nil → constant (2) | Baseline — retourner un User hardcodé satisfait le cas nominal | ✅ GREEN |
| 2 | should reject login when the email is not registered in the system | unconditional → conditional (4) | Le constant User du test 1 est toujours retourné même pour un email inconnu → force un lookup par email + exception si absent | ✅ GREEN |
| 3 | should reject login when the password does not match the stored password for the given email | unconditional → conditional (4) | Après test 2, l'user est toujours retourné dès que l'email existe → force la vérification du mot de passe via passwordEncoder.matches() | ✅ GREEN |

### Fichiers à créer

- `backend/src/test/java/com/nutrition/backend/application/usecase/LoginUserUseCaseTest.java`
- Réutilise `FakeUserRepository`, `FakePasswordEncoder`

---

## Use Case 3 — `UpdateUserProfileUseCase`

### Logique non triviale

1. Si `dailyCalorieGoal` est fourni explicitement, il prend la priorité sur le calcul MBR.
2. Si `dailyCalorieGoal` est null, la valeur est recalculée par MBR avec les nouvelles métriques corporelles.
3. L'email n'est mis à jour que s'il est fourni (non null).
4. Le `dailyStepsGoal` n'est mis à jour que s'il est fourni (non null).
5. Lève `UserNotFoundException` si l'utilisateur n'existe pas.
6. `weighInDay` conserve la valeur existante si null est fourni (géré dans `User.withBodyMetrics`).

### Liste de tests ordonnés (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should recalculate the daily calorie goal from body metrics when no explicit goal is provided | nil → constant (2) | Baseline — peut être satisfait en renvoyant un User avec une constante dailyCalorieGoal | ✅ GREEN |
| 2 | should use the explicitly provided daily calorie goal instead of recalculating from MBR when a goal is explicitly set | unconditional → conditional (4) | Le calcul automatique du test 1 écrase l'objectif fourni → force un null-check sur dailyCalorieGoal avant de décider d'utiliser la valeur fournie ou le MBR | ✅ GREEN |
| 3 | should preserve the existing email when no new email is provided during profile update | unconditional → conditional (4) | La mise à jour inconditionnelle de l'email du test 2 écrase l'email actuel même si null est fourni → force le null-check sur email | ✅ GREEN |
| 4 | should preserve the existing daily steps goal when no new steps goal is provided during profile update | unconditional → conditional (4) | La mise à jour inconditionnelle du dailyStepsGoal écrase la valeur existante si null → force le null-check sur dailyStepsGoal | ✅ GREEN |
| 5 | should prevent profile update when the user does not exist in the system | unconditional → conditional (4) | L'update fonctionne pour tout userId → force le findById + exception UserNotFoundException | ✅ GREEN |

### Fichiers à créer

- `backend/src/test/java/com/nutrition/backend/application/usecase/UpdateUserProfileUseCaseTest.java`
- Réutilise `FakeUserRepository`

---

## Use Case 4 — `RecordDailyEntryUseCase`

### Logique non triviale

L'effet de bord : après la sauvegarde de l'entrée, `autoCompleteObjectivesUseCase.execute()` est appelé avec `userId`, `date` et `caloriesBurned`. C'est le seul comportement non trivial — la sauvegarde seule serait un thin wrapper. Le couplage avec l'auto-complétion des objectifs est le cœur du test.

### Liste de tests ordonnés (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should save the daily entry and return it when recording a daily entry | nil → constant (2) | Baseline — retourner l'entrée sauvegardée peut être satisfait par une implémentation triviale | ✅ GREEN |
| 2 | should trigger objective auto-completion after saving the daily entry when calories burned are recorded | unconditional → constant (2) | Le test 1 ne vérifie pas l'effet de bord — l'auto-complétion n'est jamais appelée → force l'appel à autoCompleteObjectivesUseCase.execute() après la sauvegarde | ✅ GREEN |

**Note de conception :** `AutoCompleteObjectivesUseCase` est une dépendance à fixer. Deux approches : créer un `SpyAutoCompleteObjectivesUseCase` qui enregistre les appels reçus (préférable pour un test unitaire sociable), ou utiliser la vraie implémentation avec ses propres fakes. La première option est recommandée pour isoler ce use case.

### Fichiers à créer

- `backend/src/test/java/com/nutrition/backend/application/usecase/RecordDailyEntryUseCaseTest.java`
- `FakeDailyEntryRepository` (in-memory)
- `SpyAutoCompleteObjectivesUseCase` ou fake d'`ObjectiveRepository` + fake de `CompleteObjectiveUseCase`

---

## Use Case 5 — `RecordWeightEntryUseCase`

### Logique non triviale

Effet de bord : après la sauvegarde de la pesée, le `currentWeight` de l'User est mis à jour si l'User est trouvé. Si l'User n'existe pas (`findById` retourne empty), la mise à jour est silencieusement ignorée. C'est le comportement non trivial.

### Liste de tests ordonnés (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should save the weight entry and return it when recording a new weight measurement | nil → constant (2) | Baseline — retourner l'entrée sauvegardée | ✅ GREEN |
| 2 | should update the user current weight to match the new weight entry when the user exists in the system | unconditional → constant (2) | Le test 1 ne vérifie pas la mise à jour de l'User → force l'appel à userRepository.findById() + userRepository.save() avec le nouveau poids | ✅ GREEN |
| 3 | should silently ignore the user weight update when the user associated with the weight entry does not exist | unconditional → conditional (4) | Après test 2, l'implémentation appelle save() inconditionnellement — pour un userId inexistant, elle lèverait une exception → force le `ifPresent` qui ne sauvegarde que si l'User est trouvé | ✅ GREEN |

### Fichiers à créer

- `backend/src/test/java/com/nutrition/backend/application/usecase/RecordWeightEntryUseCaseTest.java`
- `FakeWeightEntryRepository`, réutilise `FakeUserRepository`

---

## Use Case 6 — `GetDailyRecapUseCase`

### Logique non triviale

C'est le use case avec le plus de logique de calcul :

1. `stepsKcal = StepsCalculator.toKcal(steps, currentWeight)` — plancher de 4 000 pas, proportionnel au poids
2. `netCalories = caloriesConsumed - caloriesBurned - stepsKcal`
3. `deficit = tdee - netCalories`
4. `deficitPercentage = ((tdee - netCalories) / mbr) * 100`
5. Lève `DailyCaloriesNotFoundException` si pas d'entrée pour la date
6. Lève `IllegalStateException` si l'User est introuvable pour un userId existant en base

**Note d'architecture :** Ce use case importe `DailyRecapResponse` depuis `infrastructure.web.dto` — violation Clean Architecture (dépendance vers l'extérieur depuis l'application). Le plan de tests ne corrige pas cela mais les tests le documenteront implicitement.

### Liste de tests ordonnés (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should compute net calories as consumed minus burned minus steps calories when all values are positive | nil → constant (2) | Baseline — peut être satisfait par une constante netCalories | ✅ GREEN |
| 2 | should compute zero steps calories when steps are below the threshold of 4000 | unconditional → conditional (4) | Avec des steps = 3000, la constante du test 1 est fausse → force l'appel réel à StepsCalculator qui applique le plancher | ✅ GREEN |
| 3 | should include the MBR and TDEE values in the recap based on the user body metrics | constant → variable (3) | MBR et TDEE sont des constantes dans l'implémentation minimale → force le calcul réel via MbrCalculator avec le profil de l'User | ✅ GREEN |
| 4 | should compute the deficit as the difference between TDEE and net calories in the daily recap | constant → variable (3) | Le déficit est une constante → force le calcul `tdee - netCalories` en utilisant les valeurs calculées des tests précédents | ✅ GREEN |
| 5 | should compute the deficit percentage relative to the MBR value in the daily recap | constant → variable (3) | Le pourcentage est une constante → force le calcul `((tdee - netCalories) / mbr) * 100` | ✅ GREEN |
| 6 | should prevent recap computation when no daily entry exists for the requested date | unconditional → conditional (4) | L'implémentation ne vérifie pas l'absence d'entrée → force le `orElseThrow` avec `DailyCaloriesNotFoundException` | ✅ GREEN |

### Fichiers à créer

- `backend/src/test/java/com/nutrition/backend/application/usecase/GetDailyRecapUseCaseTest.java`
- `FakeDailyEntryRepository` (réutilisable depuis RecordDailyEntryUseCase), réutilise `FakeUserRepository`

---

## Récapitulatif global — Fichiers à créer

| Fichier de test | Use case couvert |
|----------------|-----------------|
| `RegisterUserUseCaseTest.java` | RegisterUserUseCase |
| `LoginUserUseCaseTest.java` | LoginUserUseCase |
| `UpdateUserProfileUseCaseTest.java` | UpdateUserProfileUseCase |
| `RecordDailyEntryUseCaseTest.java` | RecordDailyEntryUseCase |
| `RecordWeightEntryUseCaseTest.java` | RecordWeightEntryUseCase |
| `GetDailyRecapUseCaseTest.java` | GetDailyRecapUseCase |

| Fake / Spy à créer | Réutilisé par |
|--------------------|--------------|
| `FakeUserRepository` | Register, Login, UpdateProfile, RecordWeight, GetDailyRecap |
| `FakePasswordEncoder` | Register, Login |
| `FakeDailyEntryRepository` | RecordDailyEntry, GetDailyRecap |
| `FakeWeightEntryRepository` | RecordWeight |
| `SpyAutoCompleteObjectivesUseCase` | RecordDailyEntry |

---

## Design Notes

- **Convention de nommage** : `[UseCaseName]Test`, méthodes `should_[résultat]_when_[condition]`
- **Fakes partagés** : regrouper `FakeUserRepository`, `FakePasswordEncoder`, `FakeDailyEntryRepository`, `FakeWeightEntryRepository` dans `src/test/java/com/nutrition/backend/application/usecase/fake/` pour les réutiliser entre les tests
- **MbrCalculator et StepsCalculator** : utiliser les vraies implémentations (pas de mock) — ce sont des domain services sans dépendances externes, les tests bénéficient de la vraie formule
- **SpyAutoCompleteObjectivesUseCase** : ne pas mocker, ne pas instancier la vraie implémentation avec ses dépendances — créer un spy léger qui enregistre l'appel et expose les arguments reçus pour assertion
- **Violation d'architecture dans GetDailyRecapUseCase** : `DailyRecapResponse` vient de `infrastructure.web.dto` — les tests le documenteront implicitement mais ne corrigent pas la dette ; à noter pour migration future vers un résultat de port propre
- **Ordre d'implémentation recommandé** : commencer par `LoginUserUseCase` (le plus simple, 3 tests), puis `RegisterUserUseCase`, puis `RecordWeightEntryUseCase`, puis `UpdateUserProfileUseCase`, puis `RecordDailyEntryUseCase`, enfin `GetDailyRecapUseCase` (le plus complexe)
