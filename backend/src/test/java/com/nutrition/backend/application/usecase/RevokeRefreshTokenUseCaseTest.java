package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RevokeRefreshTokenUseCaseTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RevokeRefreshTokenUseCase revokeRefreshTokenUseCase;

    @Test
    void should_delete_token_when_found() {
        RefreshToken token = new RefreshToken(1L, 42L, "raw-token", LocalDateTime.now().plusDays(7));
        when(refreshTokenRepository.findByToken("raw-token")).thenReturn(Optional.of(token));

        revokeRefreshTokenUseCase.execute("raw-token");

        verify(refreshTokenRepository).deleteByUserId(42L);
    }

    @Test
    void should_be_silent_when_token_not_found() {
        when(refreshTokenRepository.findByToken("unknown-token")).thenReturn(Optional.empty());

        revokeRefreshTokenUseCase.execute("unknown-token");

        verify(refreshTokenRepository, never()).deleteByUserId(any());
    }
}
