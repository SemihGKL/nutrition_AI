package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = issueRefreshTokenUseCase.execute(userId);

        assertThat(rawToken).isNotNull().isNotBlank();
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken saved = captor.getValue();
        assertThat(saved.userId()).isEqualTo(userId);
        assertThat(saved.token()).isEqualTo(rawToken);
        assertThat(saved.expiresAt()).isAfter(Instant.now().plus(6, ChronoUnit.DAYS));
    }

    @Test
    void should_revoke_existing_token_before_issuing_new_one() {
        Long userId = 42L;
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        issueRefreshTokenUseCase.execute(userId);

        verify(refreshTokenRepository).deleteByUserId(userId);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
        InOrder order = inOrder(refreshTokenRepository);
        order.verify(refreshTokenRepository).deleteByUserId(userId);
        order.verify(refreshTokenRepository).save(any());
    }
}
