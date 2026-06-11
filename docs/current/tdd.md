# TDD Analysis — HTTP Boundary Tests (Controllers + Frontend API clients)

**Test Type:** Two separate test suites:
- Backend: INTEGRATION (`@WebMvcTest` — HTTP layer + Spring Security filter, no full context)
- Frontend: UNIT (Vitest + `vi.fn()` fetch mock — pure URL/body contract verification)

**Feature Area (Backend):**
- `backend/src/test/java/com/nutrition/backend/Controller/`

**Feature Area (Frontend):**
- `frontend/src/api/__tests__/`

**Bounded Context:** monolith — `Controller/` + `Service/` + `Config/`

---

## EXPLORE Findings

### Backend context

| Item | Detail |
|---|---|
| Security | Stateless JWT. `JwtAuthenticationFilter` reads `Authorization: Bearer <token>` header, calls `TokenService.extractSubject` + `isTokenValid`, sets `Authentication` in `SecurityContextHolder`. All routes except `/api/auth/**` are protected. |
| Auth injection | Controllers receive `Authentication auth` — `auth.getName()` returns the email extracted from the JWT. |
| Exception to HTTP mapping | `GlobalExceptionHandler` (@RestControllerAdvice): `UserNotFoundException` → 404, `DailyCaloriesNotFoundException` → 404, `IllegalArgumentException` → 400, `DateTimeParseException` → 400. |
| Date parsing | `LocalDate.parse(date)` is called inside the controller method body — an invalid segment (e.g. `"19"`) throws `DateTimeParseException` which the advice maps to 400. |
| Upsert behaviour | `DailyCaloriesService.saveDailyCalories` looks up by `(userId, date)`; if found it updates in-place, if not it inserts. The controller always responds 200 regardless of insert/update. |
| `UserService.getByEmail` | Throws `UserNotFoundException` (→ 404) when no user matches the JWT email. Already covered by `UserServiceTest` at the service layer. |
| DTO shapes | `CreateDailyCaloriesRequest(Long id, LocalDate date, int caloriesConsumed, int steps, int caloriesBurned, boolean confirmed)` — no `userId` field. `CreateWeighInRequest(LocalDate date, double weight, String note)` — no `userId` field. |
| Response shapes | `DailyCalories` entity (id, date, caloriesConsumed, steps, caloriesBurned, confirmed — `user` is @JsonIgnore). `WeeklyWeighIn` entity (id, date, weight, note — `user` is @JsonIgnore). `UserDto` record (id, username, email, dailyCalorieGoal, weightGoal, gender, age, height, startWeight, currentWeight, weighInDay). `DailyRecapResponse` record (date, caloriesConsumed, caloriesBurned, steps, netCalories, dailyCalorieGoal, mbr, tdee, deficit, deficitPercentage, confirmed). |
| Existing test style | `@ExtendWith(MockitoExtension.class)`, `@Mock`, `@InjectMocks`, AssertJ assertions (`assertThat`, `assertThatThrownBy`). No `@WebMvcTest` tests exist yet. |

### Frontend context

| Item | Detail |
|---|---|
| HTTP client | `client.ts` — a thin `fetch` wrapper. `api.get`, `api.post`, `api.put`, `api.patch`. Reads JWT from `readPersistedToken()`. Throws `ApiError(status, message)` on non-2xx. Returns `undefined` (cast as T) on 204 or empty `content-length`. |
| `daily.ts` | `getByDate(date)` → `GET /api/daily-kcal/{date}`, catches 404 → null. `getAll()` → `GET /api/daily-kcal`. `save(entry)` → `POST /api/daily-kcal` with body `{id, date, caloriesConsumed, steps, caloriesBurned, confirmed}` — no `userId`. `getRecap(date)` → `GET /api/daily-kcal/{date}/recap`. |
| `weighIn.ts` | `getAll()` → `GET /api/weighin`. `getLatest()` → `GET /api/weighin/latest`, catches any error → null. `save(data)` → `POST /api/weighin` with body `{date, weight, note}` — no `userId`. |
| Test tooling | Vitest and `@vitest/globals` are **not yet installed** — `package.json` has no test dependencies. The test plan must note the required setup step. |
| `DailyCalories` type (`types/api.ts`) | Has a `user: { id: number }` field. The `save` call in `daily.ts` correctly omits it from the POST body — this is the contract the test must pin. |

---

## Suite A — Backend `@WebMvcTest` controller tests

### Ordered Test List — `DailyCaloriesControllerTest`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should return all daily entries for the authenticated user when a valid JWT is provided | nil → constant (2) | Baseline — can be satisfied by the real controller + mocked service returning any list | ✅ GREEN |
| 2 | should return 401 when no JWT token is provided to any daily-kcal endpoint | unconditional → conditional (4) | The always-200 baseline from Test 1 must now branch on the presence of a valid token — forces security filter wiring to be validated | ✅ GREEN |
| 3 | should return the daily entry for a valid date when the entry exists for the authenticated user | nil → constant (2) | New endpoint variant (`GET /{date}`) — baseline can be satisfied by the mock returning a fixed entry | ✅ GREEN |
| 4 | should return 404 when no entry exists for the given date for the authenticated user | unconditional → conditional (4) | The constant-return from Test 3 cannot handle the absent case — forces `DailyCaloriesNotFoundException` path to propagate as 404 | ✅ GREEN |
| 5 | should return 400 when the date segment in the URL cannot be parsed as a calendar date | unconditional → conditional (4) | Contradicts Test 3's assumption that the path segment is always a valid date — forces `DateTimeParseException` to 400 mapping to be exercised at the HTTP layer (the bug: `GET /api/daily-kcal/19`) | ✅ GREEN |
| 6 | should save a new daily entry and return the saved entry when the POST body contains valid fields without a userId | nil → constant (2) | New endpoint (`POST /`) — baseline satisfied by mock returning the entry | ✅ GREEN |
| 7 | should apply upsert behaviour and return the updated entry when POSTing for a date that already has an entry | unconditional → conditional (4) | The constant-return from Test 6 cannot distinguish insert from update — forces the mock to reflect the update path and the response to carry the existing entry's id | ✅ GREEN |
| 8 | should return the daily recap for the authenticated user when a valid date is provided | nil → constant (2) | New endpoint (`GET /{date}/recap`) — satisfied by mocked `DailyRecapService.getRecap` returning a fixed response | ✅ GREEN |

### Ordered Test List — `WeeklyWeighInControllerTest`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should return all weigh-ins for the authenticated user when a valid JWT is provided | nil → constant (2) | Baseline — can be satisfied by mocked service returning a fixed list | ✅ GREEN |
| 2 | should return the latest weigh-in for the authenticated user when at least one weigh-in exists | nil → constant (2) | New endpoint (`GET /latest`) — the constant list from Test 1 does not cover this route; satisfied by mock returning one entry | ✅ GREEN |
| 3 | should return 204 when no weigh-in has ever been recorded for the authenticated user | unconditional → conditional (4) | The always-200 from Test 2 is wrong when the service returns an empty Optional — forces the `noContent()` branch to be exercised | ✅ GREEN |
| 4 | should save a new weigh-in and return the saved entry when the POST body contains valid fields without a userId | nil → constant (2) | New endpoint (`POST /`) — forces POST route to be wired and the absence of `userId` in the accepted request body to be verified | ✅ GREEN |

### Ordered Test List — `UserControllerTest`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should return the profile of the authenticated user when a valid JWT is provided | nil → constant (2) | Baseline — satisfied by mocked service returning a fixed User and UserMapper producing a UserDto | ✅ GREEN |
| 2 | should return the updated profile when a PUT request contains all required body fields for the authenticated user | nil → constant (2) | New endpoint (`PUT /me`) — the GET-only baseline from Test 1 does not cover this route; forces the three `userService` calls and the final `getUserById` fetch to be wired | ✅ GREEN |
| 3 | should skip updating the calorie goal when the dailyCalorieGoal field is absent from the PUT body | unconditional → conditional (4) | The always-update logic from Test 2 is wrong when `dailyCalorieGoal` is null — forces the `if (request.dailyCalorieGoal() != null)` branch to be visible at the contract level | ✅ GREEN |

---

## Suite B — Frontend Vitest API client tests

**Pre-condition:** Vitest and `@vitest/globals` must be installed before these tests can run.
Required dev-dependencies: `vitest`, `@vitest/globals` (and optionally `jsdom` for environment).

### Ordered Test List — `daily.test.ts`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should call GET /api/daily-kcal when fetching all daily entries | nil → constant (2) | Baseline — verifies the simplest URL is constructed correctly | ✅ GREEN |
| 2 | should call GET /api/daily-kcal/{date} with the exact date string when fetching a single entry | constant → variable (3) | The fixed URL from Test 1 cannot satisfy a parameterised path — forces the date interpolation to be verified | ✅ GREEN |
| 3 | should return null instead of throwing when the single-entry request receives a 404 response | unconditional → conditional (4) | The always-resolve behaviour from Test 2 is wrong for 404 — forces the catch-and-return-null branch to be exercised | ✅ GREEN |
| 4 | should call POST /api/daily-kcal with a body that contains date, caloriesConsumed, steps, caloriesBurned, and confirmed but no userId field | nil → constant (2) | New method (`save`) — pins the exact POST body shape; the absence of `userId` is the critical assertion that would have caught the production bug | ✅ GREEN |
| 5 | should call GET /api/daily-kcal/{date}/recap with the exact date string when fetching a recap | constant → variable (3) | The fixed POST from Test 4 does not cover this GET+param route — forces the recap URL interpolation to be verified | ✅ GREEN |

### Ordered Test List — `weighIn.test.ts`

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | should call GET /api/weighin when fetching all weigh-ins | nil → constant (2) | Baseline — verifies the simplest URL | ✅ GREEN |
| 2 | should call GET /api/weighin/latest when fetching the latest weigh-in | nil → constant (2) | New route — the `/weighin` URL from Test 1 is wrong for the `/latest` sub-route | ✅ GREEN |
| 3 | should return null instead of throwing when the latest weigh-in request fails with any error | unconditional → conditional (4) | The always-resolve behaviour from Test 2 is wrong for error cases — forces the catch-and-return-null branch | ✅ GREEN |
| 4 | should call POST /api/weighin with a body that contains date, weight, and note but no userId field | nil → constant (2) | New method (`save`) — pins the POST body; the absence of `userId` is the contract assertion | ✅ GREEN |

---

## Files to Create

### Backend
- `backend/src/test/java/com/nutrition/backend/Controller/DailyCaloriesControllerTest.java`
- `backend/src/test/java/com/nutrition/backend/Controller/WeeklyWeighInControllerTest.java`
- `backend/src/test/java/com/nutrition/backend/Controller/UserControllerTest.java`

### Frontend (after installing Vitest)
- `frontend/src/api/__tests__/daily.test.ts`
- `frontend/src/api/__tests__/weighIn.test.ts`

---

## Design Notes

### Backend (@WebMvcTest wiring)

- **Test class annotation:** `@WebMvcTest(XxxController.class)` loads only the web slice (controller + security filter chain + advice). `GlobalExceptionHandler` is auto-included as a `@RestControllerAdvice` in the same scan path.
- **Security setup:** Use `@MockBean TokenService`. To simulate an authenticated request configure `when(tokenService.extractSubject(anyString())).thenReturn("test@example.com")` and `when(tokenService.isTokenValid(anyString(), anyString())).thenReturn(true)` so the filter populates `SecurityContextHolder`. Pass `Authorization: Bearer fake-token` on each request.
- **Dependencies to `@MockBean`:** `UserService`, `DailyCaloriesService`, `DailyRecapService` for `DailyCaloriesControllerTest`; `UserService`, `WeeklyWeighInService` for `WeeklyWeighInControllerTest`; `UserService` for `UserControllerTest`. Also `@MockBean TokenService` in every class.
- **`UserService.getByEmail` stub:** Every test that goes past the security filter needs `when(userService.getByEmail("test@example.com")).thenReturn(userWithId(1L))` in `@BeforeEach`.
- **401 test:** Send the request without an `Authorization` header — the filter does nothing, Spring Security denies access with 401. No stub needed.
- **400 via `DateTimeParseException`:** Call `GET /api/daily-kcal/19` (or any non-ISO-date string). `LocalDate.parse("19")` throws `DateTimeParseException` which `GlobalExceptionHandler.handleDateTimeParse` maps to 400. No extra mock needed.
- **404 via `DailyCaloriesNotFoundException`:** Configure `dailyCaloriesService.getDailyCalories(any(), any())` to return `Optional.empty()` — the controller calls `orElseThrow(() -> new DailyCaloriesNotFoundException(...))` which the advice maps to 404.
- **Upsert POST (200 both times):** No need for two requests in one test — write two separate test methods, each mocking `saveDailyCalories` to return the appropriate entry. Assert status 200 in both; assert `id` in the update variant matches the existing entry's id.
- **Assertion style:** MockMvc fluent API — `mockMvc.perform(...).andExpect(status().isOk())`, `andExpect(jsonPath("$.caloriesConsumed").value(1800))`. Keep assertions on the observable HTTP contract only (status code, JSON field presence/value).
- **Naming convention:** `should_[résultat]_when_[condition]` with underscores, matching all existing test classes in this project.

### Frontend (Vitest)

- **Install step:** `npm install --save-dev vitest @vitest/globals` and add `"test": "vitest"` to `package.json` scripts. Add `test: { globals: true, environment: 'jsdom' }` to `vite.config.ts`.
- **Fetch mock:** `vi.spyOn(globalThis, 'fetch').mockResolvedValue(...)` before each test. Return a minimal Response-shaped object: `{ ok: true, status: 200, json: () => Promise.resolve(payload), headers: { get: () => null }, text: () => Promise.resolve('') }`.
- **Token mock:** `vi.mock('../../auth/session', () => ({ readPersistedToken: () => 'test-token' }))` at the top of the test file so `client.ts` sends an `Authorization` header without hitting real storage.
- **`sessionBus` mock:** `vi.mock('../../auth/sessionBus', () => ({ sessionBus: { emitSessionExpired: vi.fn() } }))` to prevent module import errors.
- **URL assertion:** Capture the first argument of the spied `fetch` call — `expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/daily-kcal/2026-06-11')`.
- **Body assertion (no `userId`):** Parse the body from the spy — `const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)` — then `expect(body).not.toHaveProperty('userId')` and `expect(body).toHaveProperty('caloriesConsumed')`.
- **Test file structure:** `describe('dailyApi', () => { beforeEach(() => { vi.restoreAllMocks(); vi.mock(...); }); ... })`.
