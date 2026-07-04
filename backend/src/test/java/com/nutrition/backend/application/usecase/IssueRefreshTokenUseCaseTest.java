package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueRefreshTokenUseCaseTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private IssueRefreshTokenUseCase issueRefreshTokenUseCase;

    @Test
    void should_create_refresh_token_for_user() {
        Long userId = 1L;

        String rawToken = issueRefreshTokenUseCase.execute(userId);

        assertThat(rawToken).isNotNull().isNotBlank();
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).replaceUserTokens(eq(userId), captor.capture());
        RefreshToken saved = captor.getValue();
        assertThat(saved.userId()).isEqualTo(userId);
        assertThat(saved.token()).isEqualTo(rawToken);
        assertThat(saved.expiresAt()).isAfter(Instant.now().plus(6, ChronoUnit.DAYS));
    }

    @Test
    void should_replace_existing_tokens_atomically_when_issuing() {
        Long userId = 42L;

        issueRefreshTokenUseCase.execute(userId);

        // Une seule opération atomique (plus de deleteByUserId + save séparés).
        verify(refreshTokenRepository).replaceUserTokens(eq(userId), any(RefreshToken.class));
        verifyNoMoreInteractions(refreshTokenRepository);
    }
}
