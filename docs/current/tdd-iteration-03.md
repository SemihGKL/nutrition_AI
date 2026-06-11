# TDD Analysis — Iteration 03 : ActivityLevel, MbrCalculator, WeeklyWeighIn synchronisation, UserService.getByEmail

**Test Type:** UNIT (logique de domaine et service — aucun indicateur HTTP ou base de données)

**Feature Area:** `backend/src/main/java/com/nutrition/backend/domain/model/`, `backend/src/main/java/com/nutrition/backend/domain/service/`, `backend/src/main/java/com/nutrition/backend/Service/`

**Bounded Context:** domain (ActivityLevel, MbrCalculator, UserProfile) + service layer (WeeklyWeighInService, UserService)

---

## Contexte et décisions clés avant d'écrire les tests

### Conflit avec un test existant de MbrCalculatorTest

`MbrCalculatorTest` contient :

```java
@Test
void should_always_use_sedentary_coefficient_regardless_of_activity_level() {
    // TDEE = MBR × 1.2 always — exercise is logged daily, not baked into the coefficient
    assertEquals(2136.0, calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE)).tdee(), 0.001);
    ...
}
```

Ce test **documente délibérément la règle actuelle** et sera **cassé** par l'évolution demandée. Il faut le **supprimer** avant (ou pendant) le cycle RED correspondant — il ne représente plus une règle métier valide après la migration. Les autres tests de `MbrCalculatorTest` (`should_calculate_mbr_for_male`, `should_calculate_mbr_for_female`, `should_calculate_daily_calorie_goal_as_mbr_minus_200_rounded_to_50`) ne testent pas le TDEE et ne seront pas cassés *si* la signature de `UserProfile` est mise à jour en même temps.

### Changement de signature de UserProfile

`UserProfile` est un `record`. Ajouter `activityLevel` est un changement de signature cassant. Tous les sites qui construisent un `UserProfile` (production et test) doivent être mis à jour dans le même batch de scaffolding. Les tests existants de `MbrCalculatorTest` qui instancient `UserProfile(80.0, 180.0, 30, Gender.MALE)` devront passer à `UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.SEDENTARY)` pour compiler.

### WeeklyWeighInService — dépendance supplémentaire

La synchronisation `currentWeight` nécessite de sauvegarder l'utilisateur. `WeeklyWeighInService` n'a pas de `UserRepository` en dépendance. Il faudra en injecter un. Le test existant `should_save_weighin_when_valid_data` utilise `@InjectMocks` avec Mockito — le nouveau test ajoutera un `@Mock UserRepository` dans la même classe.

---

## Groupe 1 — ActivityLevel (enum de domaine)

### Ordered Test List

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | `should_expose_coefficient_1_2_when_activity_level_is_sedentary` | nil → constant (2) | Baseline — peut être satisfait par une valeur codée en dur | ⏳ Pending |
| 2 | `should_expose_coefficient_1_375_when_activity_level_is_lightly_active` | unconditional → conditional (4) | La valeur constante 1.2 de l'implémentation précédente est fausse pour LIGHTLY_ACTIVE — force une branche par valeur d'enum | ⏳ Pending |
| 3 | `should_expose_coefficient_1_55_when_activity_level_is_moderately_active` | unconditional → conditional (4) | Étend le pattern conditionnel — force la valeur MODERATELY_ACTIVE | ⏳ Pending |
| 4 | `should_expose_coefficient_1_725_when_activity_level_is_very_active` | unconditional → conditional (4) | Force la valeur VERY_ACTIVE | ⏳ Pending |
| 5 | `should_expose_coefficient_1_9_when_activity_level_is_extremely_active` | unconditional → conditional (4) | Force la valeur EXTREMELY_ACTIVE — complète l'enum | ⏳ Pending |

### Files to Create

- `backend/src/main/java/com/nutrition/backend/domain/model/ActivityLevel.java` — enum avec 5 valeurs, chacune exposant `double coefficient()`
- `backend/src/test/java/com/nutrition/backend/domain/model/ActivityLevelTest.java`

### Design Notes

- L'enum porte lui-même son coefficient via une méthode `coefficient()` (pas un switch externe) — cohérent avec la règle "Tell, Don't Ask"
- Aucun framework Spring dans cet enum — domain pur
- Tester chaque valeur séparément pour rendre la progression TPP explicite — 5 tests courts, chacun forçant une seule valeur
- La progression TPP pour un enum à N valeurs est : test 1 → constant, tests 2..N → chaque valeur supplémentaire est une branche conditionnelle supplémentaire (ou une entrée de tableau/map selon l'implémentation choisie)

---

## Groupe 2 — MbrCalculator — utiliser activityLevel.coefficient()

> **Prérequis :** ActivityLevel existe (Groupe 1 terminé), UserProfile a été mis à jour pour inclure `ActivityLevel activityLevel` comme 5e composant du record.
>
> **Action préalable :** Supprimer le test `should_always_use_sedentary_coefficient_regardless_of_activity_level` de `MbrCalculatorTest` — il documente une règle remplacée.
>
> **Action préalable :** Mettre à jour les 4 tests existants de `MbrCalculatorTest` qui construisent `new UserProfile(w, h, a, g)` pour passer à `new UserProfile(w, h, a, g, ActivityLevel.SEDENTARY)`. Les valeurs attendues de `mbr` et `dailyCalorieGoal` ne changent pas. Le test `should_calculate_tdee_for_sedentary_activity` attend `2136.0` — cette valeur reste correcte avec SEDENTARY (1.2).

### Ordered Test List

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 6 | `should_calculate_tdee_using_sedentary_coefficient_when_activity_level_is_sedentary` | unconditional → conditional (4) | Reformulation du test existant après mise à jour de signature — vérifie que le résultat TDEE est toujours 2136.0 quand `ActivityLevel.SEDENTARY` est passé. Ce test remplace `should_always_use_sedentary_coefficient_regardless_of_activity_level` qui est supprimé. | ⏳ Pending |
| 7 | `should_calculate_tdee_using_activity_coefficient_when_activity_level_is_lightly_active` | unconditional → conditional (4) | `1780 × 1.2 = 2136` ne convient plus pour LIGHTLY_ACTIVE — force l'implémentation à utiliser `activityLevel.coefficient()` au lieu du literal `1.2` | ⏳ Pending |
| 8 | `should_calculate_tdee_using_activity_coefficient_when_activity_level_is_very_active` | unconditional → conditional (4) | Confirme la généralisation — `1780 × 1.725 = 3070.5` ; si l'implémentation avait codé des cas spéciaux au lieu d'utiliser `coefficient()`, ce test la force à généraliser | ⏳ Pending |

**Valeurs de référence pour les tests 7 et 8 :**

- Test 7 : `profile(80, 180, 30, MALE, LIGHTLY_ACTIVE)` → MBR = 1780, TDEE = 1780 × 1.375 = **2447.5**
- Test 8 : `profile(80, 180, 30, MALE, VERY_ACTIVE)` → MBR = 1780, TDEE = 1780 × 1.725 = **3070.5**

### Files to Modify

- `backend/src/main/java/com/nutrition/backend/domain/model/UserProfile.java` — ajouter `ActivityLevel activityLevel` comme 5e composant du record
- `backend/src/main/java/com/nutrition/backend/domain/service/MbrCalculator.java` — remplacer `mbr * 1.2` par `mbr * profile.activityLevel().coefficient()`
- `backend/src/test/java/com/nutrition/backend/domain/service/MbrCalculatorTest.java` — supprimer le test obsolète, mettre à jour les 4 signatures `UserProfile`, ajouter les tests 6-8
- `backend/src/main/java/com/nutrition/backend/Service/UserService.java` — mettre à jour les deux sites qui construisent `new UserProfile(...)` pour passer `ActivityLevel` (valeur par défaut `SEDENTARY` en attendant l'intégration complète, ou extraire de l'entité `User` si ce champ est ajouté)

### Design Notes

- `MbrCalculator` porte déjà `@Component` Spring — c'est de la dette architecturale (annotation Spring dans le domaine) mais ne pas aggraver : ne pas la supprimer dans ce cycle, la migration Clean Architecture est progressive
- Les tests de `MbrCalculatorTest` construisent `new MbrCalculator()` directement (sans Spring) — cette pratique est correcte, continuer ainsi
- `UserService` crée des `UserProfile` dans `createUser` et `updateBodyMetrics` — les deux doivent passer `ActivityLevel.SEDENTARY` comme valeur par défaut fixe dans un premier temps (l'utilisateur ne peut pas encore choisir son niveau d'activité depuis l'API)
- Les tests de `UserServiceTest` mockent `mbrCalculator.calculate(any())` — ils ne seront pas cassés par le changement de signature de `UserProfile` (Mockito ne valide pas les arguments typés par `any()`)

---

## Groupe 3 — WeeklyWeighInService — synchroniser currentWeight

### Ordered Test List

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 9 | `should_update_user_current_weight_when_saving_weighin` | unconditional → conditional (4) | L'implémentation actuelle de `saveWeighIn` ne touche pas `user.currentWeight` — ce test l'y contraint en vérifiant que `userRepository.save(user)` est appelé avec le bon poids | ⏳ Pending |
| 10 | `should_save_weighin_after_updating_user_current_weight_when_saving_weighin` | unconditional → conditional (4) | Vérifie l'ordre des opérations : `user.currentWeight` doit être mis à jour **avant** que `weighInRepository.save` soit appelé, afin que l'état cohérent soit persisté | ⏳ Pending |

**Note sur le test 10 :** Si l'implémentation du test 9 place naturellement la mise à jour avant la sauvegarde de la pesée, le test 10 peut être intégré dans le test 9 via une vérification `InOrder` Mockito. Dans ce cas, ne créer qu'un seul test qui vérifie les deux garanties.

### Files to Modify

- `backend/src/main/java/com/nutrition/backend/Service/WeeklyWeighInService.java` — injecter `UserRepository`, mettre à jour `currentWeight` et sauvegarder l'utilisateur dans `saveWeighIn`
- `backend/src/test/java/com/nutrition/backend/Service/WeeklyWeighInServiceTest.java` — ajouter `@Mock UserRepository userRepository` et les tests 9-10

### Design Notes

- Les tests existants de `WeeklyWeighInServiceTest` utilisent `@InjectMocks WeeklyWeighInService` — Mockito réinjectera automatiquement le nouveau `@Mock UserRepository` une fois déclaré, sans modifier les tests existants
- Le test 9 devra utiliser `verify(userRepository).save(user)` (Mockito) après l'appel à `saveWeighIn` — convention cohérente avec le style du projet
- L'entité `User` expose `setCurrentWeight(double)` — utiliser ce setter existant (Lombok `@Setter` sur `User`)
- `WeeklyWeighIn.getUser()` retourne l'objet `User` — pas besoin de refetch depuis le repository

---

## Groupe 4 — UserService.getByEmail

### Ordered Test List

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 11 | `should_return_user_when_email_exists` | nil → constant (2) | Baseline — peut être satisfait par retourner n'importe quel utilisateur | ⏳ Pending |
| 12 | `should_throw_exception_when_email_not_found` | unconditional → conditional (4) | La valeur constante de l'implémentation précédente n'est jamais absente — force un branchement sur `Optional.empty()` qui lance `UserNotFoundException` | ⏳ Pending |

### Files to Modify

- `backend/src/main/java/com/nutrition/backend/Service/UserService.java` — ajouter `getByEmail(String email)` retournant `User`, lançant `UserNotFoundException` si absent
- `backend/src/test/java/com/nutrition/backend/Service/UserServiceTest.java` — ajouter les tests 11-12

### Design Notes

- `UserRepository.findByEmail(String)` existe déjà — aucun nouveau port à créer
- Le message d'exception doit mentionner l'email (par analogie avec `getUserById` qui mentionne l'ID dans son message)
- Pattern identique à `getUserById` — factoriser le pattern `findBy(...).orElseThrow(...)` dans la nouvelle méthode
- Les tests doivent utiliser `assertThatThrownBy` (AssertJ) + `isInstanceOf(UserNotFoundException.class)` — convention du projet

---

## Récapitulatif des fichiers

### À créer

| Fichier | Raison |
|---------|--------|
| `backend/src/main/java/com/nutrition/backend/domain/model/ActivityLevel.java` | Nouveau concept de domaine |
| `backend/src/test/java/com/nutrition/backend/domain/model/ActivityLevelTest.java` | Tests pour ActivityLevel |

### À modifier

| Fichier | Nature de la modification |
|---------|--------------------------|
| `backend/src/main/java/com/nutrition/backend/domain/model/UserProfile.java` | Ajouter `ActivityLevel activityLevel` comme 5e composant |
| `backend/src/main/java/com/nutrition/backend/domain/service/MbrCalculator.java` | Remplacer `1.2` par `profile.activityLevel().coefficient()` |
| `backend/src/test/java/com/nutrition/backend/domain/service/MbrCalculatorTest.java` | Supprimer test obsolète, mettre à jour signatures `UserProfile`, ajouter tests 6-8 |
| `backend/src/main/java/com/nutrition/backend/Service/UserService.java` | Mettre à jour les deux `new UserProfile(...)` + ajouter `getByEmail` |
| `backend/src/main/java/com/nutrition/backend/Service/WeeklyWeighInService.java` | Injecter `UserRepository`, synchroniser `currentWeight` |
| `backend/src/test/java/com/nutrition/backend/Service/WeeklyWeighInServiceTest.java` | Ajouter `@Mock UserRepository`, ajouter tests 9-10 |
| `backend/src/test/java/com/nutrition/backend/Service/UserServiceTest.java` | Ajouter tests 11-12 |

---

## Ordre d'exécution recommandé

1. **Groupe 1** (ActivityLevelTest + ActivityLevel) — aucune dépendance externe
2. **Groupe 2** (MbrCalculatorTest mis à jour + UserProfile modifié + MbrCalculator modifié) — dépend de ActivityLevel
3. **Groupe 3** (WeeklyWeighInServiceTest + WeeklyWeighInService) — indépendant de 1 et 2
4. **Groupe 4** (UserServiceTest + UserService) — indépendant de 1, 2 et 3

Les groupes 3 et 4 peuvent être exécutés en parallèle avec les groupes 1 et 2 si souhaité.
