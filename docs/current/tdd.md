# TDD Analysis — Suivi calorique quotidien et règles métier des pas

**Test Type:** UNIT (logique métier pure, Mockito + AssertJ, aucun HTTP ni base de données)

**Feature Area:** `backend/src/test/java/com/nutrition/backend/Service/`

**Bounded Context:** Service layer (dette architecturale assumée — même package que les tests existants)

---

## Contexte et périmètre

### Ce qui est déjà couvert (ne pas re-tester)

| Classe testée | Fichier de test |
|---|---|
| `MbrCalculator` | `MbrCalculatorTest` — MBR homme/femme, TDEE ×1.2, objectif = (MBR-200) arrondi à 50 |
| `Mbr` | `MbrTest` — `deficitPercentage()` : déficit, surplus, équilibre |
| `UserService` | `UserServiceTest` — création, user not found, updateProfile, updateCalorieGoal, updateBodyMetrics |
| `WeeklyWeighInService` | `WeeklyWeighInServiceTest` — saveWeighIn, getAllByUser trié DESC, getLatestByUser, liste vide |
| `DailyRecapService` | `DailyRecapServiceTest` — recap avec déficit (steps=8000), recap avec surplus (steps=0), recap sans entrée |

### Ce qui reste non couvert

**Groupe A — `DailyCaloriesService`** : aucun test existant sur les 3 méthodes.

**Groupe B — `DailyRecapService` / règle des pas** : le cas `steps < 4000` (baseline sédentaire → 0 kcal extra brûlées) n'est pas couvert. Le test existant exerce uniquement `steps=8000` (au-dessus du seuil) et `steps=0` (zéro pas, mais le résultat `0 kcal extra` est identique à `steps < 4000` — la règle spécifique du seuil n'est pas explicitement validée).

---

## Ordered Test List (TPP + FLFI)

### Groupe A — `DailyCaloriesService`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should save and return a daily calories entry when valid data is provided | nil → constant (2) | Baseline — peut être satisfait par un stub retournant toujours l'entrée passée en argument | ✅ GREEN |
| 2 | should return the daily calories entry for a specific user and date when an entry exists | nil → constant (2) | Indépendant du test 1 — établit la lecture par userId+date ; peut être satisfait en retournant une liste constante | ✅ GREEN |
| 3 | should return an empty list when no daily calories entry exists for the given user and date | unconditional → conditional (4) | Le retour constant d'une entrée du test 2 est incompatible — force un comportement conditionnel sur l'absence de données | ✅ GREEN |
| 4 | should return all daily calories entries for a user when multiple entries exist across different dates | scalar → collection (5) | Un résultat scalaire ou mono-entrée est insuffisant — force le retour d'une collection de plusieurs entrées | ✅ GREEN |
| 5 | should return an empty list when a user has no daily calories entries at all | unconditional → conditional (4) | Le retour d'une liste peuplée du test 4 est incompatible — force le cas de la liste vide sur getAllDailyCalories | ✅ GREEN |

### Groupe B — `DailyRecapService` : cas limite des pas

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 6 | should count zero extra calories burned from steps when the user has walked fewer than 4000 steps | unconditional → conditional (4) | Les tests existants couvrent uniquement steps=8000 (seuil dépassé) et steps=0 (zéro pas). Ce test force explicitement la branche `steps < 4000 → effectiveSteps = 0`, distincte de `steps = 0`. Il vérifie que 3999 pas n'ajoutent aucune calorie brûlée extra au recap, ce qu'aucun test existant ne garantit. | ✅ GREEN |

---

## Files to Create

- `backend/src/test/java/com/nutrition/backend/Service/DailyCaloriesServiceTest.java` — nouveau fichier de test (Groupe A)
- Aucun nouveau fichier de production — `DailyCaloriesService` et `DailyRecapService` existent déjà

---

## Design Notes

- **Convention de nommage des tests** : `should_[résultat]_when_[condition]` avec underscores (identique à `UserServiceTest`, `WeeklyWeighInServiceTest`)
- **Extension JUnit 5** : `@ExtendWith(MockitoExtension.class)` — identique à tous les tests existants dans `Service/`
- **Dépendances mockées** : `DailyCaloriesRepository` pour `DailyCaloriesService` (pattern identique à `WeeklyWeighInServiceTest`)
- **Assertions** : AssertJ (`assertThat`) — identique à `DailyRecapServiceTest` et `UserServiceTest`
- **Setup `DailyCaloriesService`** : `@Mock DailyCaloriesRepository` + `@InjectMocks DailyCaloriesService`
- **Setup test 6 (`DailyRecapService`)** : même structure que `DailyRecapServiceTest` existant — `@Mock UserService`, `@Mock DailyCaloriesService`, `DailyRecapService` instancié manuellement avec `new MbrCalculator()` dans `@BeforeEach`
- **Valeur clé du test 6** : `steps = 3999`, `caloriesBurned = 0`, `caloriesConsumed = X` → `netCalories` doit être égal à `caloriesConsumed` (aucune soustraction de kcal liés aux pas), confirmant que le seuil à 4000 est bien respecté
- **Règle `stepsToKcal` documentée dans `DailyRecapService`** : `effectiveSteps = Math.max(0, steps - 4000)` — la méthode est `private static`, testée indirectement via `getRecap()`
