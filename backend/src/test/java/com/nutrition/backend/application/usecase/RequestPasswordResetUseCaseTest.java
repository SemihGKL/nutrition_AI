package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePasswordResetTokenRepository;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.application.usecase.fake.SpyEmailPort;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class RequestPasswordResetUseCaseTest {

    private FakeUserRepository userRepository;
    private FakePasswordResetTokenRepository tokenRepository;
    private SpyEmailPort emailPort;
    private RequestPasswordResetUseCase useCase;

    @BeforeEach
    void setUp() {
        userRepository = new FakeUserRepository();
        tokenRepository = new FakePasswordResetTokenRepository();
        emailPort = new SpyEmailPort();
        useCase = new RequestPasswordResetUseCase(userRepository, tokenRepository, emailPort);
    }

    private User buildUser(String email) {
        return new User(null, "testuser", email, "hashed_password",
                Gender.MALE, 30, 175.0, 70.0, 70.0, 1800, 65, "MONDAY", null);
    }

    @Test
    void should_do_nothing_when_email_is_not_registered() {
        // Given — email inconnu, repository vide

        // When
        useCase.execute("unknown@example.com", "https://app.example.com");

        // Then — aucun token sauvegardé, aucun email envoyé
        assertThat(tokenRepository.getAll()).isEmpty();
        assertThat(emailPort.wasEmailSent()).isFalse();
    }

    @Test
    void should_save_a_password_reset_token_when_email_is_registered() {
        // Given
        userRepository.save(buildUser("alice@example.com"));

        // When
        useCase.execute("alice@example.com", "https://app.example.com");

        // Then — un token est sauvegardé pour cet utilisateur
        assertThat(tokenRepository.getAll()).hasSize(1);
        var token = tokenRepository.getAll().get(0);
        assertThat(token.token()).isNotBlank();
        assertThat(token.userId()).isNotNull();
    }

    @Test
    void should_generate_a_token_that_expires_in_one_hour_when_email_is_registered() {
        // Given
        userRepository.save(buildUser("alice@example.com"));
        Instant before = Instant.now();

        // When
        useCase.execute("alice@example.com", "https://app.example.com");

        // Then — le token expire dans ~1 heure (entre 59min55s et 1h5s de maintenant)
        Instant after = Instant.now();
        var token = tokenRepository.getAll().get(0);
        assertThat(token.expiresAt()).isAfter(before.plus(59, ChronoUnit.MINUTES).plusSeconds(55));
        assertThat(token.expiresAt()).isBefore(after.plus(1, ChronoUnit.HOURS).plusSeconds(5));
    }

    @Test
    void should_delete_previous_reset_tokens_before_saving_the_new_one_when_email_is_registered() {
        // Given — un premier token existe déjà pour cet utilisateur
        User user = userRepository.save(buildUser("alice@example.com"));
        useCase.execute("alice@example.com", "https://app.example.com");
        assertThat(tokenRepository.getAll()).hasSize(1);
        String firstToken = tokenRepository.getAll().get(0).token();

        // When — un second appel est effectué (rotation de token)
        useCase.execute("alice@example.com", "https://app.example.com");

        // Then — seul le nouveau token est présent, l'ancien a été supprimé
        assertThat(tokenRepository.getAll()).hasSize(1);
        assertThat(tokenRepository.getAll().get(0).token()).isNotEqualTo(firstToken);
    }

    @Test
    void should_send_a_reset_email_containing_the_token_when_email_is_registered() {
        // Given
        userRepository.save(buildUser("alice@example.com"));

        // When
        useCase.execute("alice@example.com", "https://app.example.com");

        // Then — un email est envoyé à l'adresse de l'utilisateur avec le lien contenant le token
        assertThat(emailPort.wasEmailSent()).isTrue();
        assertThat(emailPort.getLastSentTo()).isEqualTo("alice@example.com");
        String savedToken = tokenRepository.getAll().get(0).token();
        assertThat(emailPort.getLastSentLink())
                .isEqualTo("https://app.example.com/reset-password?token=" + savedToken);
    }
}
