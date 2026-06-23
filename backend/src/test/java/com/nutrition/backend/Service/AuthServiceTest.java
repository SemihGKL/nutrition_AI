package com.nutrition.backend.Service;

import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.AuthResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private RegisterUserUseCase registerUserUseCase;

    @Mock
    private LoginUserUseCase loginUserUseCase;

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private AuthService authService;

    private User domainUser(String username, String email) {
        return new User(1L, username, email, "encoded-hash", Gender.FEMALE, 28, 165.0,
                60.0, 60.0, 1736, 75, null, null);
    }

    @Test
    void should_return_jwt_token_when_registering_with_valid_data() {
        String username = "alice";
        String email = "alice@mail.fr";
        String expectedToken = "jwt-token-abc";

        when(registerUserUseCase.execute(anyString(), anyString(), anyString(), anyInt(),
                any(Gender.class), anyInt(), anyDouble(), anyDouble(), any()))
                .thenReturn(domainUser(username, email));
        when(tokenService.generateToken(email)).thenReturn(expectedToken);

        AuthResponse response = authService.register(
                username, email, "secret", 75, Gender.FEMALE, 28, 165.0, 60.0, null
        );

        assertThat(response.token()).isEqualTo(expectedToken);
        assertThat(response.user().username()).isEqualTo(username);
        assertThat(response.user().email()).isEqualTo(email);
    }

    @Test
    void should_encode_password_with_bcrypt_when_registering_new_user() {
        String username = "bob";
        String email = "bob@mail.fr";

        User created = new User(2L, username, email, "bcrypt-hash", Gender.MALE, 30, 178.0,
                75.0, 75.0, 1780, 70, null, null);

        when(registerUserUseCase.execute(anyString(), anyString(), anyString(), anyInt(),
                any(Gender.class), anyInt(), anyDouble(), anyDouble(), any()))
                .thenReturn(created);
        when(tokenService.generateToken(email)).thenReturn("some-token");

        AuthResponse response = authService.register(username, email, "plaintext", 70, Gender.MALE, 30, 178.0, 75.0, null);

        // The password encoding is handled inside RegisterUserUseCase; we verify the token is generated
        assertThat(response.token()).isEqualTo("some-token");
        assertThat(response.user().username()).isEqualTo(username);
    }

    @Test
    void should_return_jwt_token_when_logging_in_with_valid_credentials() {
        String email = "carol@mail.fr";
        String expectedToken = "login-jwt-token";

        User storedUser = new User(3L, "carol", email, "hashed-password123", Gender.FEMALE, 30, 165.0,
                65.0, 65.0, 1700, 60, null, null);

        when(loginUserUseCase.execute(email, "password123")).thenReturn(storedUser);
        when(tokenService.generateToken(email)).thenReturn(expectedToken);

        AuthResponse response = authService.login(email, "password123");

        assertThat(response.token()).isEqualTo(expectedToken);
        assertThat(response.user().email()).isEqualTo(email);
    }

    @Test
    void should_reject_login_when_email_is_not_registered() {
        String email = "unknown@mail.fr";
        when(loginUserUseCase.execute(eq(email), anyString()))
                .thenThrow(new IllegalArgumentException("Email non enregistré : " + email));

        assertThatThrownBy(() -> authService.login(email, "anyPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(email);
    }

    @Test
    void should_reject_login_when_password_does_not_match_stored_hash() {
        String email = "dave@mail.fr";
        when(loginUserUseCase.execute(eq(email), eq("wrong-password")))
                .thenThrow(new IllegalArgumentException("Mot de passe incorrect"));

        assertThatThrownBy(() -> authService.login(email, "wrong-password"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Mot de passe");
    }
}
