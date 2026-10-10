package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePasswordEncoder;
import com.nutrition.backend.application.usecase.fake.FakePasswordResetTokenRepository;
import com.nutrition.backend.application.usecase.fake.FakeRefreshTokenRepository;
import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.InvalidPasswordResetTokenException;
import com.nutrition.backend.domain.exception.WeakPasswordException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.PasswordPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResetPasswordUseCaseTest {

    private FakeUserRepository userRepository;
    private FakePasswordResetTokenRepository tokenRepository;
    private FakePasswordEncoder passwordEncoder;
    private FakeRefreshTokenRepository refreshTokenRepository;
    private PasswordPolicy passwordPolicy;
    private ResetPasswordUseCase useCase;

    @BeforeEach
    void setUp() {
        userRepository = new FakeUserRepository();
        tokenRepository = new FakePasswordResetTokenRepository();
        passwordEncoder = new FakePasswordEncoder();
        passwordPolicy = new PasswordPolicy();
        refreshTokenRepository = new FakeRefreshTokenRepository();
        useCase = new ResetPasswordUseCase(userRepository, tokenRepository, passwordEncoder, passwordPolicy,
                refreshTokenRepository);
    }

    private User buildUser(String email) {
        return new User(null, "testuser", email, "encoded_old_password",
                Gender.MALE, 30, 175.0, 70.0, 70.0, 1800, 65, "MONDAY", null);
    }

    private PasswordResetToken validToken(Long userId) {
        return new PasswordResetToken(null, userId, "valid-token-uuid",
                Instant.now().plus(1, ChronoUnit.HOURS), false);
    }

    @Test
    void should_reject_password_reset_when_token_does_not_exist() {
        // Given — repository de tokens vide

        // When / Then
        assertThatThrownBy(() -> useCase.execute("non-existent-token", "new_password"))
                .isInstanceOf(InvalidPasswordResetTokenException.class);
    }

    @Test
    void should_update_user_password_when_token_is_valid() {
        // Given
        User user = userRepository.save(buildUser("alice@example.com"));
        tokenRepository.save(validToken(user.getId()));

        // When
        useCase.execute("valid-token-uuid", "new_secure_password");

        // Then — le mot de passe de l'utilisateur a été mis à jour
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getPasswordHash()).isEqualTo(passwordEncoder.encode("new_secure_password"));
    }

    @Test
    void should_mark_token_as_used_after_successful_password_reset() {
        // Given
        User user = userRepository.save(buildUser("alice@example.com"));
        tokenRepository.save(validToken(user.getId()));

        // When
        useCase.execute("valid-token-uuid", "new_secure_password");

        // Then — le token est marqué comme utilisé
        PasswordResetToken token = tokenRepository.findByToken("valid-token-uuid").orElseThrow();
        assertThat(token.used()).isTrue();
    }

    @Test
    void should_reject_password_reset_when_new_password_is_too_weak() {
        // Given — un token valide mais un nouveau mot de passe trop court
        User user = userRepository.save(buildUser("alice@example.com"));
        tokenRepository.save(validToken(user.getId()));

        // When / Then — la politique de mot de passe rejette la réinitialisation
        assertThatThrownBy(() -> useCase.execute("valid-token-uuid", "short"))
                .isInstanceOf(WeakPasswordException.class);
    }

    @Test
    void should_not_update_password_when_new_password_is_too_weak() {
        // Given
        User user = userRepository.save(buildUser("alice@example.com"));
        String originalPasswordHash = user.getPasswordHash();
        tokenRepository.save(validToken(user.getId()));

        // When — la réinitialisation échoue car le mot de passe est trop faible
        try {
            useCase.execute("valid-token-uuid", "short");
        } catch (WeakPasswordException ignored) {
        }

        // Then — le mot de passe de l'utilisateur n'a pas été modifié
        User userAfter = userRepository.findById(user.getId()).orElseThrow();
        assertThat(userAfter.getPasswordHash()).isEqualTo(originalPasswordHash);
    }

    @Test
    void should_reject_password_reset_when_token_is_expired() {
        // Given — un token expiré (expiresAt dans le passé)
        User user = userRepository.save(buildUser("alice@example.com"));
        PasswordResetToken expiredToken = new PasswordResetToken(null, user.getId(), "expired-token",
                Instant.now().minus(1, ChronoUnit.HOURS), false);
        tokenRepository.save(expiredToken);

        // When / Then
        assertThatThrownBy(() -> useCase.execute("expired-token", "new_password"))
                .isInstanceOf(InvalidPasswordResetTokenException.class);
    }

    @Test
    void should_reject_password_reset_when_token_has_already_been_used() {
        // Given — un token déjà utilisé
        User user = userRepository.save(buildUser("alice@example.com"));
        PasswordResetToken usedToken = new PasswordResetToken(null, user.getId(), "used-token",
                Instant.now().plus(1, ChronoUnit.HOURS), true);
        tokenRepository.save(usedToken);

        // When / Then
        assertThatThrownBy(() -> useCase.execute("used-token", "new_password"))
                .isInstanceOf(InvalidPasswordResetTokenException.class);
    }

    @Test
    void should_not_update_user_password_when_token_is_invalid() {
        // Given — un token expiré
        User user = userRepository.save(buildUser("alice@example.com"));
        String originalPasswordHash = user.getPasswordHash();
        PasswordResetToken expiredToken = new PasswordResetToken(null, user.getId(), "expired-token",
                Instant.now().minus(1, ChronoUnit.HOURS), false);
        tokenRepository.save(expiredToken);

        // When — la réinitialisation échoue car le token est invalide
        try {
            useCase.execute("expired-token", "new_password");
        } catch (InvalidPasswordResetTokenException ignored) {
        }

        // Then — le mot de passe de l'utilisateur n'a pas été modifié
        User userAfter = userRepository.findById(user.getId()).orElseThrow();
        assertThat(userAfter.getPasswordHash()).isEqualTo(originalPasswordHash);
    }

    // ── Sessions ouvertes coupées ───────────────────────────────────────────

    private void openSession(Long userId, String token) {
        refreshTokenRepository.save(new RefreshToken(null, userId, token, Instant.now().plus(7, ChronoUnit.DAYS)));
    }

    @Test
    void should_revoke_every_open_session_of_the_user_when_password_is_reset() {
        User user = userRepository.save(buildUser("alice@example.com"));
        tokenRepository.save(validToken(user.getId()));
        openSession(user.getId(), "session-phone");
        openSession(user.getId(), "session-stolen");

        useCase.execute("valid-token-uuid", "new_secure_password");

        assertThat(refreshTokenRepository.findByToken("session-phone")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("session-stolen")).isEmpty();
    }

    @Test
    void should_keep_sessions_of_other_users_when_password_is_reset() {
        User alice = userRepository.save(buildUser("alice@example.com"));
        User bob = userRepository.save(buildUser("bob@example.com"));
        tokenRepository.save(validToken(alice.getId()));
        openSession(bob.getId(), "session-bob");

        useCase.execute("valid-token-uuid", "new_secure_password");

        assertThat(refreshTokenRepository.findByToken("session-bob")).isPresent();
    }

    @Test
    void should_keep_sessions_when_the_reset_is_rejected() {
        User user = userRepository.save(buildUser("alice@example.com"));
        tokenRepository.save(validToken(user.getId()));
        openSession(user.getId(), "session-phone");

        assertThatThrownBy(() -> useCase.execute("valid-token-uuid", "123"))
                .isInstanceOf(com.nutrition.backend.domain.exception.WeakPasswordException.class);
        assertThat(refreshTokenRepository.findByToken("session-phone")).isPresent();
    }
}
