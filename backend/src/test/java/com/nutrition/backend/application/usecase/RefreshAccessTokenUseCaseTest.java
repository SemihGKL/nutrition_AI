package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.InvalidRefreshTokenException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.domain.ports.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshAccessTokenUseCaseTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RefreshAccessTokenUseCase refreshAccessTokenUseCase;

    private final User testUser = new User(1L, "Test", "test@example.com", "hash",
            Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", null);

    @Test
    void should_return_new_tokens_when_refresh_token_is_valid() {
        RefreshToken validToken = new RefreshToken(1L, 1L, "old-raw-token",
                LocalDateTime.now().plusDays(7));
        when(refreshTokenRepository.findByToken("old-raw-token")).thenReturn(Optional.of(validToken));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tokenService.generateToken("test@example.com")).thenReturn("new-access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshAccessTokenUseCase.Result result = refreshAccessTokenUseCase.execute("old-raw-token");

        assertThat(result.accessToken()).isEqualTo("new-access-token");
        assertThat(result.refreshToken()).isNotBlank().isNotEqualTo("old-raw-token");
        verify(refreshTokenRepository).deleteByUserId(1L);
        verify(refreshTokenRepository).save(any());
    }

    @Test
    void should_throw_when_refresh_token_not_found() {
        when(refreshTokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshAccessTokenUseCase.execute("unknown-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Refresh token invalide ou expiré");

        verify(refreshTokenRepository, never()).deleteByUserId(any());
        verify(tokenService, never()).generateToken(anyString());
    }

    @Test
    void should_throw_and_revoke_when_refresh_token_is_expired() {
        RefreshToken expiredToken = new RefreshToken(2L, 1L, "expired-token",
                LocalDateTime.now().minusDays(1));
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> refreshAccessTokenUseCase.execute("expired-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);

        verify(refreshTokenRepository).deleteByUserId(1L);
        verify(tokenService, never()).generateToken(anyString());
    }
}
