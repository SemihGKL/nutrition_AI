package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePasswordEncoder;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginUserUseCaseTest {

    private FakeUserRepository userRepository;
    private FakePasswordEncoder passwordEncoder;
    private LoginUserUseCase loginUserUseCase;

    @BeforeEach
    void setUp() {
        userRepository = new FakeUserRepository();
        passwordEncoder = new FakePasswordEncoder();
        loginUserUseCase = new LoginUserUseCase(userRepository, passwordEncoder);
    }

    private User buildUser(String email, String rawPassword) {
        return new User(null, "testuser", email, passwordEncoder.encode(rawPassword),
                Gender.MALE, 30, 175.0, 70.0, 70.0, 1800, 65, "MONDAY", null);
    }

    @Test
    void should_return_authenticated_user_when_email_and_password_are_both_correct() {
        // Given
        User saved = userRepository.save(buildUser("alice@example.com", "secret123"));

        // When
        User result = loginUserUseCase.execute("alice@example.com", "secret123");

        // Then
        assertThat(result.getId()).isEqualTo(saved.getId());
        assertThat(result.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    void should_reject_login_when_email_is_not_registered() {
        // Given — empty repository

        // When / Then
        assertThatThrownBy(() -> loginUserUseCase.execute("unknown@example.com", "secret123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email non enregistré");
    }

    @Test
    void should_reject_login_when_password_does_not_match_stored_password() {
        // Given
        userRepository.save(buildUser("alice@example.com", "correct_password"));

        // When / Then
        assertThatThrownBy(() -> loginUserUseCase.execute("alice@example.com", "wrong_password"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Mot de passe incorrect");
    }
}
