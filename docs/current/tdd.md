# TDD Analysis — Persistance des objectifs utilisateur en base de données

**Test Type:** UNIT (Suite A — Mockito), E2E/@WebMvcTest (Suite B), UNIT/Vitest (Suite C)

**Feature Area:**
- Backend service: `backend/src/main/java/com/nutrition/backend/Service/`
- Backend controller: `backend/src/main/java/com/nutrition/backend/Controller/`
- Frontend API: `frontend/src/api/`

**Bounded Context:** nutrition (monolithe — dette technique assumée, packages existants conservés)

---

## Suite A — ObjectiveServiceTest (tests unitaires, Mockito)

**Fichier cible:** `backend/src/test/java/com/nutrition/backend/Service/ObjectiveServiceTest.java`

**Wiring:** `@ExtendWith(MockitoExtension.class)`, `@Mock UserObjectiveRepository`, `@Mock ObjectiveCompletionRepository`, `@InjectMocks ObjectiveService`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| A1 | `should_return_empty_list_when_user_has_no_objectives` | nil → constant (2) | Baseline — peut être satisfait par `return List.of()` | ✅ GREEN |
| A2 | `should_return_all_objectives_when_user_has_objectives` | constant → variable (3) | La liste vide constante est fausse quand le repository retourne des objectifs — force la délégation à `findByUserId` | ✅ GREEN |
| A3 | `should_create_objective_and_return_it_when_day_of_week_and_label_are_valid` | unconditional → conditional (4) | `getObjectives` ne persiste rien — `createObjective` doit appeler `save` sur le repository et retourner l'entité persistée → introduit une nouvelle branche | ✅ GREEN |
| A4 | `should_delete_objective_when_objective_belongs_to_the_authenticated_user` | unconditional → conditional (4) | La création ne supprime pas — force `deleteById` après vérification d'existence et d'ownership | ✅ GREEN |
| A5 | `should_prevent_deletion_when_objective_does_not_belong_to_the_authenticated_user` | unconditional → conditional (4) | La suppression sans contrôle réussit même pour un objectif étranger — force la comparaison de `userId` et le lancement d'une exception d'accès | ✅ GREEN |
| A6 | `should_prevent_deletion_when_objective_does_not_exist` | unconditional → conditional (4) | L'ownership check suppose que `findById` retourne quelque chose — force la gestion du cas `Optional.empty()` avec une exception de not-found | ✅ GREEN |
| A7 | `should_mark_objective_as_done_when_no_completion_exists_for_that_date` | nil → constant (2) | Les tests précédents ne touchent pas aux completions — baseline du toggle : introduit `save` sur `ObjectiveCompletionRepository` | ✅ GREEN |
| A8 | `should_not_create_duplicate_completion_when_objective_is_already_marked_done_for_that_date` | unconditional → conditional (4) | Un deuxième `markDone` sans guard créerait un doublon (contrainte UNIQUE en base) — force `existsByObjectiveIdAndDate` avant `save` | ✅ GREEN |
| A9 | `should_remove_completion_when_objective_is_marked_undone_for_a_date` | unconditional → conditional (4) | `markDone` ne supprime pas — force `deleteByObjectiveIdAndDate` | ✅ GREEN |
| A10 | `should_return_empty_map_when_no_completions_exist_in_date_range` | nil → constant (2) | Baseline pour `getCompletions` — satisfait par `return Map.of()` quand le repository retourne une liste vide | ✅ GREEN |
| A11 | `should_return_completions_map_indexed_by_date_when_completions_exist_in_date_range` | scalar → collection (5) | La map vide constante est fausse pour des completions existantes — force l'agrégation en `Map<String, List<Long>>` groupée par date ISO | ✅ GREEN |

---

## Suite B — ObjectiveControllerTest (@WebMvcTest)

**Fichier cible:** `backend/src/test/java/com/nutrition/backend/Controller/ObjectiveControllerTest.java`

**Wiring (pattern hérité de `DailyCaloriesControllerTest`) :**
- `@WebMvcTest(ObjectiveController.class)`
- `@TestPropertySource(properties = { "jwt.secret=test-secret-key-that-is-at-least-32-characters-long", "jwt.expiration=86400000" })`
- `@MockBean TokenService tokenService`
- `@MockBean UserService userService`
- `@MockBean ObjectiveService objectiveService`
- Dans `@BeforeEach` : stub `tokenService.extractSubject` + `tokenService.isTokenValid` + `userService.getByEmail("user")`
- Chaque test authentifié porte `@WithMockUser(username = "user")`
- DELETE et POST portent `.with(csrf())`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| B1 | `should_return_401_when_request_has_no_jwt_token` | nil → constant (2) | Baseline sécurité — Spring Security rejette sans header `Authorization` | ✅ GREEN |
| B2 | `should_return_empty_list_when_authenticated_user_has_no_objectives` | constant → variable (3) | Le 401 constant ne peut pas retourner 200 avec un body JSON — force le routing `GET /api/objectives` avec l'utilisateur authentifié | ✅ GREEN |
| B3 | `should_return_list_of_objectives_when_authenticated_user_has_objectives` | constant → variable (3) | La liste vide insatisfaisante quand le service retourne des objectifs — force la sérialisation JSON de `id`, `dayOfWeek`, `label`, `position` | ✅ GREEN |
| B4 | `should_return_201_when_authenticated_user_creates_a_valid_objective` | unconditional → conditional (4) | `GET` retourne 200 ; `POST /api/objectives` doit retourner 201 avec l'objet créé — introduit la route POST et le status `CREATED` | ✅ GREEN |
| B5 | `should_return_204_when_authenticated_user_deletes_their_own_objective` | unconditional → conditional (4) | POST crée — `DELETE /api/objectives/{id}` doit retourner 204 sans body — introduit la route DELETE | ✅ GREEN |
| B6 | `should_return_404_when_authenticated_user_deletes_an_objective_that_does_not_exist` | unconditional → conditional (4) | La suppression réussit toujours dans les tests précédents — force la propagation de `ObjectiveNotFoundException` → 404 via `GlobalExceptionHandler` | ✅ GREEN |
| B7 | `should_return_403_when_authenticated_user_deletes_an_objective_that_belongs_to_another_user` | unconditional → conditional (4) | La suppression ne contrôle pas l'ownership — force `ObjectiveAccessDeniedException` → 403 via `GlobalExceptionHandler` | ✅ GREEN |
| B8 | `should_return_201_when_authenticated_user_marks_an_objective_as_done_for_a_date` | unconditional → conditional (4) | DELETE ne crée pas de completion — force `POST /api/objectives/{id}/completions/{date}` → 201 | ✅ GREEN |
| B9 | `should_return_204_when_authenticated_user_unmarks_an_objective_for_a_date` | unconditional → conditional (4) | POST completion retourne 201 — `DELETE /api/objectives/{id}/completions/{date}` doit retourner 204 | ✅ GREEN |
| B10 | `should_return_completions_map_indexed_by_date_when_authenticated_user_queries_a_date_range` | scalar → collection (5) | Les tests précédents testent des actions ponctuelles — force `GET /api/objectives/completions?from=&to=` retournant `Map<String, List<Long>>` sérialisé en JSON | ✅ GREEN |

---

## Suite C — objectives.test.ts (Vitest, frontend)

**Fichier cible:** `frontend/src/api/__tests__/objectives.test.ts`

**Prérequis :** Vitest est installé (`vitest ^4.1.8` dans `devDependencies`). Le client `api` n'expose pas encore de méthode `delete` — elle doit être ajoutée à `client.ts` en même temps que `objectives.ts`.

**Module mock (hissé en tête de fichier, avant tout import) :**
```typescript
vi.mock('../client', async () => {
  const { ApiError } = await vi.importActual<typeof import('../client')>('../client');
  return {
    ApiError,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});
```

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| C1 | `getAll calls GET /api/objectives without any userId in the path` | nil → constant (2) | Baseline — vérifie que `getAll()` appelle `api.get` avec `/api/objectives` et sans userId | ✅ GREEN |
| C2 | `create calls POST /api/objectives with body containing dayOfWeek and label but not userId` | constant → variable (3) | `getAll` appelle `get` — `create` doit appeler `post` avec un body structuré différent → force la vérification du body et l'absence de userId | ✅ GREEN |
| C3 | `remove calls DELETE /api/objectives/{id} with the correct id in the path` | unconditional → conditional (4) | POST ne supprime pas — `remove(id)` doit appeler `api.delete` avec `{id}` dans le chemin → force l'ajout de `delete` au client | ✅ GREEN |
| C4 | `markDone calls POST /api/objectives/{id}/completions/{date} with the correct id and date` | unconditional → conditional (4) | `remove` appelle `delete` — `markDone` doit appeler `post` vers un chemin distinct avec id et date interpolés | ✅ GREEN |
| C5 | `markUndone calls DELETE /api/objectives/{id}/completions/{date} with the correct id and date` | unconditional → conditional (4) | `markDone` appelle `post` sur les completions — `markUndone` doit appeler `delete` sur le même chemin → distingue DELETE de POST | ✅ GREEN |
| C6 | `getCompletions calls GET /api/objectives/completions with from and to as query parameters` | scalar → collection (5) | Les tests précédents testent des actions ponctuelles — `getCompletions(from, to)` appelle `get` avec deux query params `from` et `to` dans l'URL | ✅ GREEN |

---

## Fichiers à créer

**Backend — migration SQL :**
- `backend/src/main/resources/db/migration/V8__create_objectives_tables.sql`

**Backend — entités JPA :**
- `backend/src/main/java/com/nutrition/backend/Class/UserObjective.java`
- `backend/src/main/java/com/nutrition/backend/Class/ObjectiveCompletion.java`

**Backend — repositories :**
- `backend/src/main/java/com/nutrition/backend/Repository/UserObjectiveRepository.java`
- `backend/src/main/java/com/nutrition/backend/Repository/ObjectiveCompletionRepository.java`

**Backend — DTOs :**
- `backend/src/main/java/com/nutrition/backend/web/dto/CreateObjectiveRequest.java`
- `backend/src/main/java/com/nutrition/backend/web/dto/ObjectiveDto.java`

**Backend — exceptions (+ handlers dans `GlobalExceptionHandler`) :**
- `backend/src/main/java/com/nutrition/backend/Exception/ObjectiveNotFoundException.java`
- `backend/src/main/java/com/nutrition/backend/Exception/ObjectiveAccessDeniedException.java`

**Backend — service et controller :**
- `backend/src/main/java/com/nutrition/backend/Service/ObjectiveService.java`
- `backend/src/main/java/com/nutrition/backend/Controller/ObjectiveController.java`

**Frontend :**
- `frontend/src/api/objectives.ts`
- `frontend/src/api/__tests__/objectives.test.ts`
- (modification) `frontend/src/api/client.ts` — ajout de `delete` à l'objet `api`

---

## Design Notes

**Entités JPA (pattern `DailyCalories`) :**
- `UserObjective` : `@Entity @Getter @Setter @Table(name = "user_objectives")`, champs `id`, `userId` (`@Column(name = "user_id")`), `dayOfWeek` (`@Column(name = "day_of_week")`), `label`, `position`
- `ObjectiveCompletion` : `@Entity @Getter @Setter @Table(name = "objective_completions")`, champs `id`, `userId`, `objectiveId`, `date`

**Repositories (pattern `DailyCaloriesRepository`) :**
- `UserObjectiveRepository` : `findByUserId(Long userId)` → `List<UserObjective>`
- `ObjectiveCompletionRepository` : `existsByObjectiveIdAndDate(Long, LocalDate)`, `deleteByObjectiveIdAndDate(Long, LocalDate)`, `findByUserIdAndDateBetween(Long, LocalDate, LocalDate)`

**Ownership check (A5/A6/B6/B7) :**
- `ObjectiveService.deleteObjective(Long objectiveId, Long userId)` : appelle `findById` → lève `ObjectiveNotFoundException` si absent, compare `objective.getUserId()` avec `userId` → lève `ObjectiveAccessDeniedException` si différent, puis `deleteById`
- Étendre `GlobalExceptionHandler` avec : `ObjectiveNotFoundException` → 404, `ObjectiveAccessDeniedException` → 403

**Idempotence `markDone` (A8) :**
- Guard : `if (completionRepository.existsByObjectiveIdAndDate(objectiveId, date)) return;` — pas d'exception, pas de doublon

**Map des completions (A10/A11/B10) :**
- `ObjectiveService.getCompletions(Long userId, LocalDate from, LocalDate to)` retourne `Map<String, List<Long>>`
- Implémentation cible : `completions.stream().collect(groupingBy(c -> c.getDate().toString(), mapping(ObjectiveCompletion::getObjectiveId, toList())))`

**Controller (B) :**
- `@RequestMapping("/api/objectives")`
- `GET /` → 200 `List<ObjectiveDto>`
- `POST /` → 201 `ObjectiveDto` (body : `CreateObjectiveRequest`)
- `DELETE /{id}` → 204 (service reçoit `objectiveId` + `userId` extrait de `Authentication`)
- `POST /{id}/completions/{date}` → 201
- `DELETE /{id}/completions/{date}` → 204
- `GET /completions?from=&to=` → 200 `Map<String, List<Long>>`

**Ajout `delete` au client frontend (`client.ts`) :**
```typescript
delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
```
Le mock dans `objectives.test.ts` doit inclure `delete: vi.fn()` — identique au `delete` du mock `daily.test.ts` qui n'en avait pas besoin, mais le pattern de mock `vi.mock('../client', async () => { ... })` reste le même.

**Assertions frontend (pattern `daily.test.ts`) :**
- URL : `vi.mocked(api.get).mock.calls[0][0]`
- Body POST : `vi.mocked(api.post).mock.calls[0]` → `[path, body]` → `expect(body).not.toHaveProperty('userId')`
- Path DELETE : `vi.mocked(api.delete).mock.calls[0][0]`

**Naming convention tests backend :** `should_[résultat]_when_[condition]` en snake_case — identique aux tests existants.
