# TDD Analysis — Audit de couverture tests NutritionIA

**Test Type:** UNIT (dominant) + E2E (controllers WebMvcTest)

**Bounded Context:** backend Spring Boot + frontend React/TypeScript

---

## Synthèse par module

### Backend — Domain

| Classe | Couvert | Lacunes |
|--------|---------|---------|
| `Mbr` | deficitPercentage (déficit, surplus, équilibre) | Valeurs limites : TDEE à zéro, MBR à zéro, consommation négative |
| `MbrCalculator` | Homme/Femme, TDEE sédentaire, objectif calorique | Valeur limite : poids ou taille à zéro, âge extrême |
| `JwtTokenService` | Génération, extraction, validité, expiration | Token trafiqué (signature altérée), sujet qui ne correspond pas |

### Backend — Services

| Classe | Couvert | Lacunes |
|--------|---------|---------|
| `AuthService` | Inscription (token + encodage), connexion réussie, email inconnu, mauvais mot de passe | Email déjà enregistré (doublon) |
| `UserService` | Création, getById (trouvé/non trouvé), updateProfile, updateCalorieGoal, updateBodyMetrics, getAllUsers, getByEmail (trouvé/non trouvé) | `updateStepsGoal` non testée, `weighInDay` null ignoré dans `updateBodyMetrics` |
| `DailyCaloriesService` | Insert, update (idempotence), getByDate (trouvé/vide), getAll (multi/vide) | — (couverture fonctionnelle complète) |
| `DailyRecapService` | Déficit, surplus, aucune entrée, pas sous seuil 4 000 | Borne exacte 4 000 pas, genre invalide dans `Gender.valueOf` |
| `ObjectiveService` | Get (vide/liste), create, delete (ok/mauvais user/inexistant), markDone (idempotence), markUndone, getCompletions (vide/plein) | `autoComplete` — aucun test sur les 3 branches conditionnelles |
| `WeeklyWeighInService` | Save (retour, màj poids user, ordre persistence), getAllByUser, getLatest (trouvé/vide) | — (couverture fonctionnelle complète) |

### Backend — Controllers (WebMvcTest)

| Classe | Couvert | Lacunes |
|--------|---------|---------|
| `UserController` | GET /me (200), PUT /me (200), PUT sans dailyCalorieGoal (null) | PUT /me sans JWT (401), PUT /me avec champs invalides (400) |
| `DailyCaloriesController` | GET all (200), GET by date (200/404/400 format invalide), POST save/update, GET recap (200), 401 sans JWT | Recap 404 (aucune entrée), POST body invalide (400) |
| `ObjectiveController` | 401 sans JWT, GET (vide/liste), POST (201), DELETE (204/404/403), markDone (201), markUndone (204), getCompletions | markDone 404 (objectif inexistant), getCompletions sans from/to (400) |
| `WeeklyWeighInController` | GET all (200), GET latest (200/204), POST save (200) | POST sans JWT (401), POST body invalide (400) |

### Frontend — Utils

| Fichier | Couvert | Lacunes |
|---------|---------|---------|
| `stepsToKcal` (format.ts) | Sous-seuil, borne exacte 4000, au-dessus, scaling poids, arrondi, formule complète | Couverture complète |
| `format.ts` (autres fonctions) | Aucun test | `formatNumber`, `formatDecimal`, `addDays`, `frenchWeekday`, `frenchDay`, `frenchDateShort`, `frenchDayShort`, `weekStart`, `weekEnd`, `weekNumber` |
| `mbr.ts` | Aucun test | `computeMbr`, `computeTdee`, `suggestedTarget` |

### Frontend — Hooks

| Hook | Couvert | Lacunes |
|------|---------|---------|
| `computeStreak` | Vide, 3 jours consécutifs, gap, streak courant nul, best streak, last14 longueur/today/miss/hit | Entrées non confirmées ignorées, dates futures dans last14 |
| `useDailyEntry` | Chargement, entry null, confirm, debounce setCalories, confirm annule debounce | `setSteps` et `setBurned` sans tests, erreur réseau sur getByDate, `userId` undefined |

### Frontend — Composants

| Composant | Couvert | Lacunes |
|-----------|---------|---------|
| `DeficitBanner` | Sous objectif, dépassé mais sous MBR, au-dessus MBR, sans MBR, écart affiché | Borne exacte `net === target`, borne exacte `net === mbr` |
| `ConfirmationView` | 3 états visuels bannière, 2 états bilan jour | Bouton Modifier déclenche `onEdit` |
| `EntrySection` | Affichage steppers, sport masqué/visible, onBurned reset, estimation kcal, stepper +/-, stepsGoal indicateur | `onSteps` déclenché par le stepper Pas, calories ne descendent pas sous 0 |

### Frontend — API clients

| Module | Couvert | Lacunes |
|--------|---------|---------|
| `dailyApi` | getAll, getByDate, getByDate 404 → null, save (body sans userId), getRecap | getRecap 404 non géré |
| `objectivesApi` | getAll, create, remove, markDone, markUndone, getCompletions | — (couverture fonctionnelle complète) |
| `weighInApi` | getAll, getLatest, getLatest error → null, save (body sans userId) | — (couverture fonctionnelle complète) |

### Frontend — Flows

| Flow | Couvert | Lacunes |
|------|---------|---------|
| `DashboardPage` | Loading, formulaire si entry null, Confirmer désactivé à 0, Confirmer actif après saisie, ConfirmationView si confirmée, nav jour précédent non confirmé | Confirmation réussie → transition vers ConfirmationView, erreur réseau affichée |

---

## Liste de tests manquants — ordonnée par priorité TPP

### CRITICAL — Comportements métier non couverts avec risque de régression silencieux

| # | Test Name (convention) | Fichier cible | Priorité | Raison |
|---|------------------------|---------------|----------|--------|
| 1 | `should_complete_sport_objective_automatically_when_calories_burned_is_positive_and_day_of_week_matches` | `ObjectiveServiceTest` | CRITICAL | `autoComplete` est invoqué lors de la confirmation quotidienne — 3 branches conditionnelles imbriquées (type SPORT, jour de semaine, caloriesBurned > 0), zéro test, régression indétectable |
| 2 | `should_not_complete_sport_objective_when_calories_burned_is_zero` | `ObjectiveServiceTest` | CRITICAL | Branche explicite `caloriesBurned > 0` dans `autoComplete` — chemin négatif absent |
| 3 | `should_not_complete_objective_when_type_is_not_sport` | `ObjectiveServiceTest` | CRITICAL | Branche `"SPORT".equals(obj.getType())` — le chemin "CUSTOM" non testé, le filtre peut disparaître sans alerte |
| 4 | `should_update_daily_steps_goal_and_persist_it_when_valid_user_id_and_steps_value` | `UserServiceTest` | CRITICAL | `updateStepsGoal` est une méthode publique sans aucun test — exposée par le contrôleur pour l'objectif quotidien de pas |
| 5 | `should_throw_exception_when_gender_stored_in_database_is_invalid_during_recap_computation` | `DailyRecapServiceTest` | CRITICAL | `Gender.valueOf(user.getGender())` lève `IllegalArgumentException` si la valeur est corrompue en base — aucune protection, aucun test |

### HIGH — Lacunes sur comportements existants importants

| # | Test Name (convention) | Fichier cible | Priorité | Raison |
|---|------------------------|---------------|----------|--------|
| 6 | `should_return_false_when_token_subject_does_not_match_expected_subject` | `JwtTokenServiceTest` | HIGH | `isTokenValid` compare le sujet — seul le cas `true` (correspondance) est testé, le cas `false` (sujet différent) est absent |
| 7 | `should_throw_jwt_exception_when_token_signature_has_been_tampered` | `JwtTokenServiceTest` | HIGH | Token avec signature altérée : cas de sécurité fondamental, non testé |
| 8 | `should_preserve_existing_weigh_in_day_when_weigh_in_day_is_null_in_body_metrics_update` | `UserServiceTest` | HIGH | La condition `if (weighInDay != null)` dans `updateBodyMetrics` protège le champ existant — chemin null jamais validé |
| 9 | `should_return_zero_steps_kcal_when_steps_are_exactly_at_threshold_of_4000` | `DailyRecapServiceTest` | HIGH | `Math.max(0, 4000 - 4000)` donne 0 — borne exacte absente (les tests existants utilisent 3999 d'un côté et 8000 de l'autre) |
| 10 | `should_expose_error_state_when_getByDate_fails_with_a_network_error` | `useDailyEntry.test.ts` | HIGH | Le hook expose `error: string \| null` mais aucun test ne vérifie qu'une erreur réseau remplit ce champ |
| 11 | `should_not_go_below_zero_when_setSteps_is_called_with_a_negative_value` | `useDailyEntry.test.ts` | HIGH | `Math.max(0, v)` dans `setSteps` — même règle que `setCalories` mais non couverte pour les pas et calories brûlées |
| 12 | `should_call_onEdit_callback_when_modifier_button_is_clicked` | `ConfirmationView.test.tsx` | HIGH | Le prop `onEdit` est le seul point de sortie de la vue confirmée — non testé, peut régresser sans alerte |
| 13 | `should_return_401_when_put_user_me_request_has_no_jwt_token` | `UserControllerTest` | HIGH | Toutes les autres routes protégées ont un test 401 — `PUT /api/users/me` est la seule exception |
| 14 | `should_return_401_when_post_weighin_request_has_no_jwt_token` | `WeeklyWeighInControllerTest` | HIGH | Même lacune : `POST /api/weighin` sans JWT n'est pas couvert |
| 15 | `should_return_404_when_recap_is_requested_for_a_date_with_no_daily_entry` | `DailyCaloriesControllerTest` | HIGH | `DailyRecapService` lève `DailyCaloriesNotFoundException` si aucune entrée — le controller doit retourner 404, non testé |

### MEDIUM — Cas limites de règles métier et fonctions utilitaires non testées

| # | Test Name (convention) | Fichier cible | Priorité | Raison |
|---|------------------------|---------------|----------|--------|
| 16 | `should_compute_mbr_correctly_for_male_using_mifflin_st_jeor_formula` | `mbr.test.ts` (à créer) | MEDIUM | `computeMbr` dans `utils/mbr.ts` est une duplication de la formule Java — aucun test frontend, divergence silencieuse possible |
| 17 | `should_compute_mbr_correctly_for_female_using_mifflin_st_jeor_formula` | `mbr.test.ts` (à créer) | MEDIUM | Même raison, constante féminine (-161) non couverte côté TypeScript |
| 18 | `should_compute_suggested_target_as_mbr_minus_200_rounded_to_nearest_50` | `mbr.test.ts` (à créer) | MEDIUM | `suggestedTarget` est utilisé dans le formulaire de profil — logique d'arrondi non testée |
| 19 | `should_return_future_status_for_dates_after_today_in_last14_window` | `computeStreak.test.ts` | MEDIUM | `computeLast14` retourne `'future'` pour les dates postérieures à aujourd'hui — cas géré dans le code mais aucun test |
| 20 | `should_exclude_unconfirmed_entries_from_streak_calculation` | `computeStreak.test.ts` | MEDIUM | Des entrées `confirmed: false` ne doivent pas incrémenter le streak — règle métier centrale explicitement codée mais non testée |
| 21 | `should_display_objectif_atteint_when_net_calories_are_exactly_equal_to_daily_target` | `DeficitBanner.test.tsx` | MEDIUM | Borne exacte `net === target` : la condition `net <= target` devrait la couvrir, mais aucun test ne l'affirme explicitement |
| 22 | `should_display_objectif_depasse_deficit_preserve_when_net_calories_are_exactly_equal_to_mbr` | `DeficitBanner.test.tsx` | MEDIUM | Borne exacte `net === mbr` : selon que la condition est `<` ou `<=`, le résultat peut changer — non testé |
| 23 | `should_return_400_when_post_daily_kcal_body_is_missing_required_fields` | `DailyCaloriesControllerTest` | MEDIUM | Les annotations `@Valid` sur `CreateDailyCaloriesRequest` ne sont pas validées en test — données invalides peuvent passer |
| 24 | `should_format_number_with_french_locale_thousand_separator` | `format.test.ts` (à créer) | MEDIUM | `formatNumber` est utilisé dans plusieurs composants visuels (calories, pas, etc.) — non testé |
| 25 | `should_compute_week_start_as_monday_when_given_date_is_a_saturday` | `format.test.ts` (à créer) | MEDIUM | `weekStart` / `weekEnd` / `weekNumber` sont utilisés dans les vues récapitulatives — aucun test, calcul de calendrier fragile |

### LOW — Couverture défensive et scenarios secondaires

| # | Test Name (convention) | Fichier cible | Priorité | Raison |
|---|------------------------|---------------|----------|--------|
| 26 | `should_add_days_correctly_when_crossing_a_month_boundary` | `format.test.ts` (à créer) | LOW | `addDays` avec +1 le 31 du mois : cas de débordement de mois — fondamental pour la navigation de date |
| 27 | `should_call_onSteps_when_steps_stepper_increment_button_is_clicked` | `EntrySection.test.tsx` | LOW | Le stepper Pas appelle `onSteps` — seul le stepper Calories est explicitement testé pour le callback |
| 28 | `should_not_trigger_any_save_when_userId_is_undefined` | `useDailyEntry.test.ts` | LOW | `if (!userId) return` dans `scheduleSave` et `confirm` — `userId = undefined` ne doit pas déclencher de fetch |
| 29 | `should_not_complete_sport_objective_when_day_of_week_does_not_match_the_stored_objective_day` | `ObjectiveServiceTest` | LOW | Branche `obj.getDayOfWeek() == dow` dans `autoComplete` — chemin non-correspondant à couvrir après les tests CRITICAL |
| 30 | `should_return_400_when_post_weighin_body_is_missing_date_or_weight` | `WeeklyWeighInControllerTest` | LOW | Validation `@Valid` sur `CreateWeighInRequest` — body sans `date` ou `weight` devrait retourner 400, non couvert |

---

## Fichiers à créer

- `/Users/semihgokol/Documents/sideProjects/nutritionIA/frontend/src/__tests__/utils/mbr.test.ts` — tests de `computeMbr`, `computeTdee`, `suggestedTarget`
- `/Users/semihgokol/Documents/sideProjects/nutritionIA/frontend/src/__tests__/utils/format.test.ts` — tests de `formatNumber`, `formatDecimal`, `addDays`, `weekStart`, `weekEnd`, `weekNumber`

## Design Notes

- **Conventions Java** : `should_[résultat]_when_[condition]` en snake_case, `@ExtendWith(MockitoExtension.class)` + `@InjectMocks` + `@Mock` pour les services, `@WebMvcTest` + `@MockBean` + `@WithMockUser` + `.with(csrf())` pour les controllers
- **Conventions TypeScript** : labels lisibles dans `describe/it`, `vi.mock` pour les modules API, `renderHook` + `waitFor` pour les hooks, `vi.useFakeTimers()` uniquement pour les debounces
- **autoComplete** est la lacune la plus grave : 3 branches conditionnelles imbriquées (type, jour, caloriesBurned) sans aucun test — à traiter en priorité absolue avant toute évolution de la feature objectifs
- **Duplication de logique MBR** : la formule Mifflin-St Jeor est implémentée à la fois dans `MbrCalculator.java` et `mbr.ts` — les tests Java couvrent la formule mais la copie TypeScript n'a aucun test
- **updateStepsGoal** dans `UserService` : méthode publique exposée par l'API, utilisée par la feature objectif de pas quotidien, sans aucun test unitaire
- **Bornes exactes non testées** : la borne 4 000 pas (DailyRecapService), la borne `net === target` (DeficitBanner), la borne `net === mbr` (DeficitBanner) — les tests existants restent à 1 unité de chaque côté sans tester la valeur limite elle-même
