package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.AuthResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthService authService;

    @Test
    void should_return_jwt_token_when_registering_with_valid_data() {
        String username = "alice";
        String email = "alice@mail.fr";
        String rawPassword = "secret";
        String encodedPassword = "encoded-secret";
        String expectedToken = "jwt-token-abc";

        User created = new User();
        created.setUsername(username);
        created.setEmail(email);

        when(userService.createUser(anyString(), anyString(), any(int.class), any(Gender.class),
                any(int.class), any(Double.class), any(double.class), any())).thenReturn(created);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(created);
        when(tokenService.generateToken(email)).thenReturn(expectedToken);

        AuthResponse response = authService.register(
                username, email, rawPassword, 75, Gender.FEMALE, 28, 165.0, 60.0, null
        );

        assertThat(response.token()).isEqualTo(expectedToken);
        assertThat(response.user().username()).isEqualTo(username);
        assertThat(response.user().email()).isEqualTo(email);
    }

    @Test
    void should_encode_password_with_bcrypt_when_registering_new_user() {
        String username = "bob";
        String email = "bob@mail.fr";
        String rawPassword = "plaintext";
        String encodedPassword = "bcrypt-hash";

        User created = new User();
        created.setUsername(username);
        created.setEmail(email);

        when(userService.createUser(anyString(), anyString(), any(int.class), any(Gender.class),
                any(int.class), any(Double.class), any(double.class), any())).thenReturn(created);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(created);
        when(tokenService.generateToken(email)).thenReturn("some-token");

        authService.register(username, email, rawPassword, 70, Gender.MALE, 30, 178.0, 75.0, null);

        verify(passwordEncoder).encode(rawPassword);
        verify(userRepository).save(argThat(u -> encodedPassword.equals(u.getPassword())));
    }

    @Test
    void should_return_jwt_token_when_logging_in_with_valid_credentials() {
        String email = "carol@mail.fr";
        String rawPassword = "password123";
        String encodedPassword = "hashed-password123";
        String expectedToken = "login-jwt-token";

        User storedUser = new User();
        storedUser.setUsername("carol");
        storedUser.setEmail(email);
        storedUser.setPassword(encodedPassword);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(storedUser));
        when(passwordEncoder.matches(rawPassword, encodedPassword)).thenReturn(true);
        when(tokenService.generateToken(email)).thenReturn(expectedToken);

        AuthResponse response = authService.login(email, rawPassword);

        assertThat(response.token()).isEqualTo(expectedToken);
        assertThat(response.user().email()).isEqualTo(email);
    }

    @Test
    void should_reject_login_when_email_is_not_registered() {
        String email = "unknown@mail.fr";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(email, "anyPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(email);
    }

    @Test
    void should_reject_login_when_password_does_not_match_stored_hash() {
        String email = "dave@mail.fr";
        String wrongPassword = "wrong-password";
        String storedHash = "bcrypt-correct-hash";

        User storedUser = new User();
        storedUser.setEmail(email);
        storedUser.setPassword(storedHash);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(storedUser));
        when(passwordEncoder.matches(wrongPassword, storedHash)).thenReturn(false);

        assertThatThrownBy(() -> authService.login(email, wrongPassword))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Mot de passe");
    }
}
