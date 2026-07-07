# TDD Analysis — Réinitialisation de mot de passe par email

**Test Type:** UNIT (logique métier pure, pas de mots-clés HTTP ou base de données dans les use cases)

**Feature Area:** `backend/src/main/java/com/nutrition/backend/application/usecase/`

**Bounded Context:** auth (authentification utilisateur)

---

## Contexte et conventions observées

- Entités immuables avec constructeur complet + méthodes `with*()` (pattern `User`)
- Records immuables avec méthodes de prédicat (pattern `RefreshToken` → `isExpired()`)
- Ports = interfaces dans `domain/ports/` ; fakes in-memory dans `src/test/.../fake/`
- Exceptions domaine étendent `RuntimeException` dans `domain/exception/`
- Les use cases reçoivent des types primitifs en entrée ; retournent l'entité ou lancent une exception domaine
- Convention test : `should_[résultat]_when_[condition]` — AssertJ, JUnit 5, aucun Mockito
- `IssueRefreshTokenUseCaseTest` utilise Mockito (violation existante) — **ne pas reproduire** ; suivre le pattern `LoginUserUseCaseTest` avec de vrais fakes

---

## USE CASE 1 — RequestPasswordResetUseCase

### Rôle métier
Accepte un email. Si l'email est connu, génère un token UUID valide 1 heure, supprime les anciens tokens de l'utilisateur, et envoie un email contenant le lien de réinitialisation. Si l'email est inconnu, ne fait rien (pas d'exception — sécurité par opacité).

### Ordered Test List (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | `should_do_nothing_when_email_is_not_registered` | nil → constant (2) | Baseline — peut être satisfait par un use case dont le corps est vide (no-op total) | ✅ GREEN |
| 2 | `should_save_a_password_reset_token_when_email_is_registered` | unconditional → conditional (4) | Le no-op du test 1 ne persiste rien — il faut désormais distinguer email connu / inconnu et sauvegarder un token → force une branche conditionnelle sur la présence de l'user | ✅ GREEN |
| 3 | `should_generate_a_token_that_expires_in_one_hour_when_email_is_registered` | constant → variable (3) | Une implémentation naïve pourrait mettre une `expiresAt` constante ou nulle — force le calcul `Instant.now().plus(1, HOURS)` en vérifiant que l'expiration est bien dans ~1h | ✅ GREEN |
| 4 | `should_delete_previous_reset_tokens_before_saving_the_new_one_when_email_is_registered` | value → mutated value (8) | L'implémentation courante ne nettoie pas les anciens tokens — un second appel laisserait deux tokens actifs → force l'appel à `deleteByUserId` avant `save` | ✅ GREEN |
| 5 | `should_send_a_reset_email_containing_the_token_when_email_is_registered` | statement → side effect (4) | Le port `EmailPort` n'est pas encore appelé — force l'ajout de `sendPasswordResetEmail` avec le token généré dans le lien | ✅ GREEN |

### Fakes à créer

- **`FakePasswordResetTokenRepository`** — implémente `PasswordResetTokenRepository` ; `Map<String, PasswordResetToken>` par token, `Map<Long, List<PasswordResetToken>>` par userId ; méthode `getAll()` pour assertions ; `deleteByUserId` supprime toutes les entrées du userId
- **`SpyEmailPort`** — implémente `EmailPort` ; enregistre les appels `sendPasswordResetEmail(toEmail, resetLink)` ; méthodes `getLastSentTo()` et `getLastSentLink()` pour assertions

---

## USE CASE 2 — ResetPasswordUseCase

### Rôle métier
Accepte un token et un nouveau mot de passe. Vérifie que le token existe, n'est pas expiré, et n'a pas déjà été utilisé (`isValid()`). Si valide : met à jour le `passwordHash` de l'utilisateur via `withPasswordHash()`, marque le token comme `used`. Si invalide : lève une exception domaine.

### Ordered Test List (TPP + FLFI)

| # | Test Name | TPP | Contradiction | Status |
|---|-----------|-----|---------------|--------|
| 1 | `should_reject_password_reset_when_token_does_not_exist` | nil → constant (2) | Baseline — l'implémentation la plus simple lance toujours une exception (aucune lookup nécessaire) ; satisfait le cas "token absent" | ✅ GREEN |
| 2 | `should_update_user_password_when_token_is_valid` | unconditional → conditional (4) | Le rejet systématique du test 1 échoue ici — force une branche "token trouvé + non expiré + non utilisé → mise à jour passwordHash" | ✅ GREEN |
| 3 | `should_mark_token_as_used_after_successful_password_reset` | value → mutated value (8) | Après le test 2, le token reste `used = false` en base — force la persistance du token avec `used = true` après la mise à jour | ✅ GREEN |
| 4 | `should_reject_password_reset_when_token_is_expired` | unconditional → conditional (4) | L'implémentation accepte tout token trouvé indépendamment de l'expiration — force le contrôle `isExpired()` dans la validation | ✅ GREEN |
| 5 | `should_reject_password_reset_when_token_has_already_been_used` | unconditional → conditional (4) | La branche "valide" du test 2-3 accepterait un token `used = true` — force le contrôle `!used` dans `isValid()` | ✅ GREEN |
| 6 | `should_not_update_user_password_when_token_is_invalid` | constant → verified absence (3) | Vérifie l'absence d'effets de bord — le `passwordHash` ne doit pas être modifié quand le token est invalide ; protège la non-régression des tests d'erreur | ✅ GREEN |

### Fakes à réutiliser / créer

- **`FakeUserRepository`** — déjà dans `src/test/.../fake/FakeUserRepository.java` — réutiliser tel quel
- **`FakePasswordEncoder`** — déjà dans `src/test/.../fake/FakePasswordEncoder.java` — réutiliser tel quel
- **`FakePasswordResetTokenRepository`** — même fake que pour le use case 1 (partagé)

---

## Entité domaine à créer

### `PasswordResetToken` (record)

Suivre le pattern exact de `RefreshToken` : record Java avec méthodes de prédicat.

```
PasswordResetToken(Long id, Long userId, String token, Instant expiresAt, boolean used)
  isExpired()  → Instant.now().isAfter(expiresAt)
  isValid()    → !used && !isExpired()
```

---

## Ports à créer

### `PasswordResetTokenRepository`
```
save(PasswordResetToken token)    → PasswordResetToken
findByToken(String token)         → Optional<PasswordResetToken>
deleteByUserId(Long userId)       → void
```

### `EmailPort`
```
sendPasswordResetEmail(String toEmail, String resetLink) → void
```

---

## Exception domaine à créer

- **`InvalidPasswordResetTokenException`** — extends `RuntimeException` ; levée quand le token est absent, expiré, ou déjà utilisé ; suivre le pattern de `InvalidRefreshTokenException`

---

## Files to Create

### Production
- `domain/entity/PasswordResetToken.java` — record avec `isExpired()` et `isValid()`
- `domain/ports/PasswordResetTokenRepository.java` — interface port
- `domain/ports/EmailPort.java` — interface port
- `domain/exception/InvalidPasswordResetTokenException.java` — exception domaine
- `application/usecase/RequestPasswordResetUseCase.java` — use case 1
- `application/usecase/ResetPasswordUseCase.java` — use case 2

### Test (fakes)
- `src/test/.../fake/FakePasswordResetTokenRepository.java`
- `src/test/.../fake/SpyEmailPort.java`

### Tests
- `src/test/.../application/usecase/RequestPasswordResetUseCaseTest.java`
- `src/test/.../application/usecase/ResetPasswordUseCaseTest.java`

---

## Design Notes

- **Pattern record** : `PasswordResetToken` suit exactement `RefreshToken` — record Java avec prédicats, pas de builder
- **Opacité sécurité** : `RequestPasswordResetUseCase` ne lève jamais d'exception si l'email est inconnu — le test 1 du use case 1 valide ce comportement en vérifiant que aucun token n'est sauvegardé et aucun email envoyé
- **Réutilisation fakes** : `FakeUserRepository` et `FakePasswordEncoder` sont déjà dans `src/test/.../fake/` — les importer directement sans recréer
- **`withPasswordHash()`** : `User` expose déjà cette méthode — `ResetPasswordUseCase` s'appuie dessus sans modifier l'entité
- **Pas de Mockito** : `IssueRefreshTokenUseCaseTest` utilise Mockito (violation connue) — les deux nouveaux tests doivent suivre le pattern `LoginUserUseCaseTest` avec des fakes manuels uniquement
- **Exception domaine** : préférer `InvalidPasswordResetTokenException` dans `domain/exception/` pour rester cohérent avec `InvalidRefreshTokenException` existante
- **`deleteByUserId` avant `save`** : l'ordre est explicite dans le test 4 du use case 1 — le fake doit exposer une méthode `getAll()` permettant de vérifier qu'un seul token existe après l'opération de rotation
