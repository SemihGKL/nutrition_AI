# TDD Analysis — Iteration 02 : Use cases non couverts (UserService + Auth)

**Test Type:** UNIT (logique métier pure, pas d'HTTP ni de base de données)

**Feature Area:**
- `backend/src/main/java/com/nutrition/backend/Service/UserService.java`
- `backend/src/main/java/com/nutrition/backend/Controller/AuthController.java`
  (extraction vers `AuthService` recommandée — voir note architecture ci-dessous)

**Bounded Context:** application core (Service layer)

---

## Note architecture — Auth

Toute la logique d'authentification (`passwordEncoder.encode`, `userRepository.findByEmail`,
`jwtService.generateToken`) vit actuellement dans `AuthController`. Cela viole la règle
"pas de logique métier dans les contrôleurs". Deux options :

**Option A — Extraire un `AuthService`** (recommandé)
Tests écrits sur `AuthService` avec `@Mock UserRepository`, `@Mock PasswordEncoder`,
`@Mock TokenService`. Les tests sont rapides, purement unitaires, et la logique est dans
la bonne couche.

**Option B — Tester le contrôleur via MockMvc** (E2E léger)
Tests écrits avec `@WebMvcTest(AuthController.class)`. Plus lourd, nécessite un contexte
Spring, mais permet de ne pas bouger le code existant.

Ce plan suit l'**Option A** (extraction + tests unitaires) car c'est la seule approche
cohérente avec l'architecture cible et les conventions du projet.
Les tests `AuthServiceTest` sont écrits **avant** l'extraction —
le refactoring (déplacement du code de `AuthController` vers `AuthService`) est la
phase GREEN de ces tests.

---

## Groupe 1 — `UserService` : cas non couverts

### Ordered Test List (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | `should_return_user_when_id_exists` | nil → constant (2) | Baseline — le happy path de `getUserById` n'est pas testé ; peut être satisfait en retournant directement l'utilisateur mocké | ✅ GREEN |
| 2 | `should_return_all_users_when_users_exist` | nil → constant (2) | Baseline — `getAllUsers` délègue à `findAll` ; peut être satisfait en retournant la liste mockée | ✅ GREEN |
| 3 | `should_return_empty_list_when_no_users_exist` | unconditional → conditional (4) | La constante "liste non-vide" du test 2 ne fonctionne pas ici ; force la délégation réelle à `findAll` sans traitement particulier | ✅ GREEN |

**Fichier cible :** `UserServiceTest.java` (existant — ajouter ces trois tests)

---

## Groupe 2 — `AuthService` : inscription et connexion

### Ordered Test List (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | `should_return_jwt_token_when_registering_with_valid_data` | nil → constant (2) | Baseline — peut être satisfait en retournant un token constant sans logique réelle | ✅ GREEN |
| 2 | `should_encode_password_with_bcrypt_when_registering_new_user` | unconditional → conditional (4) | Le test 1 ne vérifie pas l'encodage BCrypt ; force un appel réel à `passwordEncoder.encode` et `userRepository.save` avec le mot de passe haché | ✅ GREEN |
| 3 | `should_return_jwt_token_when_logging_in_with_valid_credentials` | unconditional → conditional (4) | L'implémentation du test 2 (inscription) ne couvre pas le chemin login ; force une branche conditionnelle pour vérifier le mot de passe avec `passwordEncoder.matches` | ✅ GREEN |
| 4 | `should_reject_login_when_email_is_not_registered` | conditional → conditional (4) | Le chemin "email trouvé" du test 3 ne couvre pas le cas "email absent" ; force un `Optional.empty()` sur `userRepository.findByEmail` et un résultat d'échec | ✅ GREEN |
| 5 | `should_reject_login_when_password_does_not_match_stored_hash` | conditional → conditional (4) | Le test 4 vérifie l'absence d'email mais pas le mauvais mot de passe quand l'email existe ; force la vérification de `passwordEncoder.matches` retournant false | ✅ GREEN |

**Fichier cible :** `AuthServiceTest.java` (nouveau fichier à créer)

---

## Files to Create

### Nouveaux
- `backend/src/main/java/com/nutrition/backend/Service/AuthService.java`
  (extraction de la logique métier de `AuthController` — créé au GREEN du premier test)
- `backend/src/test/java/com/nutrition/backend/Service/AuthServiceTest.java`
  (créé au RED du premier test)

### Modifiés
- `backend/src/test/java/com/nutrition/backend/Service/UserServiceTest.java`
  (ajout des trois tests manquants)
- `backend/src/main/java/com/nutrition/backend/Controller/AuthController.java`
  (délègue à `AuthService` une fois les tests verts — refactoring REFACTOR)

---

## Design Notes

- **Convention de nommage :** `should_[résultat]_when_[condition]` — respecter la casse snake_case déjà présente dans `UserServiceTest`
- **Structure de test :** `@ExtendWith(MockitoExtension.class)` + `@Mock` + `@InjectMocks` — identique à `UserServiceTest` et `DailyCaloriesServiceTest`
- **Assertions :** AssertJ (`assertThat`, `assertThatThrownBy`) — pas de JUnit 5 `assertEquals`
- **Mocks `AuthService` :** `@Mock UserRepository`, `@Mock PasswordEncoder`, `@Mock TokenService` — `UserService` peut aussi être mocké si `AuthService` lui délègue la création
- **Résultat attendu `register` :** retourner un `AuthResponse(token, userDto)` ou un équivalent — à définir lors du RED en fonction de la signature choisie
- **Résultat attendu `login` KO :** lever une exception ou retourner un type résultat ; choisir lors du RED — ne pas préjuger de l'implémentation
- **DataInitializer** : aucun test requis — logique d'amorçage infrastructure, profil `dev` uniquement, idempotent par construction
- **Package cible `AuthService` :** `com.nutrition.backend.Service` — cohérent avec les autres services existants
