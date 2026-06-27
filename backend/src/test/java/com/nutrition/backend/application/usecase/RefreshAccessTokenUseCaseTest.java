package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeRefreshTokenRepository;
import com.nutrition.backend.application.usecase.fake.FakeTokenService;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.InvalidRefreshTokenException;
import com.nutrition.backend.domain.model.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RefreshAccessTokenUseCaseTest {

    private FakeRefreshTokenRepository refreshTokenRepository;
    private FakeTokenService tokenService;
    private FakeUserRepository userRepository;
    private RefreshAccessTokenUseCase refreshAccessTokenUseCase;

    private final User testUser = new User(1L, "Test", "user@test.com", "hash",
            Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", null);

    @BeforeEach
    void setUp() {
        refreshTokenRepository = new FakeRefreshTokenRepository();
        tokenService = new FakeTokenService();
        userRepository = new FakeUserRepository();
        refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(
                refreshTokenRepository, tokenService, userRepository);
    }

    @Test
    void should_return_new_tokens_when_refresh_token_is_valid() {
        // Given
        userRepository.save(testUser);
        RefreshToken validToken = new RefreshToken(1L, 1L, "valid-refresh-token",
                Instant.now().plus(7, ChronoUnit.DAYS));
        refreshTokenRepository.save(validToken);

        // When
        RefreshAccessTokenUseCase.Result result = refreshAccessTokenUseCase.execute("valid-refresh-token");

        // Then
        assertThat(result.accessToken()).isEqualTo("token-for-user@test.com");
        assertThat(result.refreshToken()).isNotBlank().isNotEqualTo("valid-refresh-token");
        assertThat(refreshTokenRepository.findByToken("valid-refresh-token")).isEmpty();
        assertThat(refreshTokenRepository.countByUserId(1L)).isEqualTo(1);
    }

    @Test
    void should_throw_when_refresh_token_not_found() {
        // Given — aucun token dans le repository

        // When / Then
        assertThatThrownBy(() -> refreshAccessTokenUseCase.execute("unknown-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Refresh token invalide ou expiré");

        assertThat(refreshTokenRepository.countByUserId(1L)).isEqualTo(0);
    }

    @Test
    void should_throw_and_revoke_all_tokens_when_refresh_token_is_expired() {
        // Given
        userRepository.save(testUser);
        RefreshToken expiredToken = new RefreshToken(2L, 1L, "valid-refresh-token",
                Instant.now().minus(1, ChronoUnit.DAYS));
        refreshTokenRepository.save(expiredToken);

        // When / Then
        assertThatThrownBy(() -> refreshAccessTokenUseCase.execute("valid-refresh-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);

        assertThat(refreshTokenRepository.countByUserId(1L)).isEqualTo(0);
    }
}
