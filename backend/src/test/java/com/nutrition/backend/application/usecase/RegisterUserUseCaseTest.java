package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePasswordEncoder;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.EmailAlreadyUsedException;
import com.nutrition.backend.domain.exception.WeakPasswordException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.MbrCalculator;
import com.nutrition.backend.domain.service.PasswordPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RegisterUserUseCaseTest {

    private FakeUserRepository userRepository;
    private FakePasswordEncoder passwordEncoder;
    private MbrCalculator mbrCalculator;
    private PasswordPolicy passwordPolicy;
    private RegisterUserUseCase registerUserUseCase;

    @BeforeEach
    void setUp() {
        userRepository = new FakeUserRepository();
        passwordEncoder = new FakePasswordEncoder();
        mbrCalculator = new MbrCalculator();
        passwordPolicy = new PasswordPolicy();
        registerUserUseCase = new RegisterUserUseCase(userRepository, passwordEncoder, mbrCalculator, passwordPolicy);
    }

    @Test
    void should_assign_mbr_derived_calorie_goal_to_new_user_when_registering_with_body_metrics() {
        // Given — male, 30 years, 175cm, 70kg
        // MBR = (10*70) + (6.25*175) - (5*30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
        // dailyCalorieGoal = round((1648.75 - 200) / 50) * 50 = round(28.975) * 50 = 29 * 50 = 1450
        int expectedCalorieGoal = 1450;

        // When
        User result = registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                65, Gender.MALE, 30, 175.0, 70.0, "MONDAY", null);

        // Then
        assertThat(result.getDailyCalorieGoal()).isEqualTo(expectedCalorieGoal);
    }

    @Test
    void should_assign_different_mbr_derived_calorie_goal_for_female_user_with_same_body_metrics() {
        // Given — female, 30 years, 175cm, 70kg
        // MBR = (10*70) + (6.25*175) - (5*30) - 161 = 700 + 1093.75 - 150 - 161 = 1482.75
        // dailyCalorieGoal = round((1482.75 - 200) / 50) * 50 = round(25.655) * 50 = 26 * 50 = 1300
        int expectedCalorieGoal = 1300;

        // When
        User result = registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                55, Gender.FEMALE, 30, 175.0, 70.0, "MONDAY", null);

        // Then
        assertThat(result.getDailyCalorieGoal()).isEqualTo(expectedCalorieGoal);
    }

    @Test
    void should_initialize_current_weight_equal_to_start_weight_when_registering_new_user() {
        // Given
        double startWeight = 82.5;

        // When
        User result = registerUserUseCase.execute(
                "bob", "bob@example.com", "password",
                75, Gender.MALE, 25, 180.0, startWeight, "FRIDAY", null);

        // Then
        assertThat(result.getCurrentWeight()).isEqualTo(startWeight);
        assertThat(result.getStartWeight()).isEqualTo(startWeight);
    }

    @Test
    void should_store_encoded_password_and_not_raw_password_when_registering_new_user() {
        // Given
        String rawPassword = "my_secret_password";

        // When
        User result = registerUserUseCase.execute(
                "charlie", "charlie@example.com", rawPassword,
                70, Gender.MALE, 28, 178.0, 75.0, "WEDNESDAY", null);

        // Then
        assertThat(result.getPasswordHash()).isNotEqualTo(rawPassword);
        assertThat(result.getPasswordHash()).isEqualTo("encoded_" + rawPassword);
    }

    @Test
    void should_store_provided_daily_steps_goal_when_registering() {
        // Given — l'utilisateur renseigne un objectif de pas à l'inscription
        int stepsGoal = 8000;

        // When
        User result = registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                65, Gender.MALE, 30, 175.0, 70.0, "MONDAY", stepsGoal);

        // Then
        assertThat(result.getDailyStepsGoal()).isEqualTo(stepsGoal);
    }

    @Test
    void should_leave_daily_steps_goal_null_when_not_provided_at_registration() {
        // When — aucun objectif de pas fourni
        User result = registerUserUseCase.execute(
                "bob", "bob@example.com", "password",
                70, Gender.MALE, 25, 180.0, 75.0, "FRIDAY", null);

        // Then
        assertThat(result.getDailyStepsGoal()).isNull();
    }

    @Test
    void should_throw_email_already_used_when_email_is_already_registered() {
        // Given — un compte existe déjà avec cet email
        registerUserUseCase.execute(
                "alice", "dup@example.com", "password",
                65, Gender.MALE, 30, 175.0, 70.0, "MONDAY", null);

        // When / Then — une seconde inscription avec le même email est rejetée (409)
        assertThatThrownBy(() -> registerUserUseCase.execute(
                "alice2", "dup@example.com", "password2",
                70, Gender.FEMALE, 28, 168.0, 62.0, "TUESDAY", null))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }

    @Test
    void should_reject_registration_when_password_is_too_weak() {
        // Given — un mot de passe trop court (moins de 8 caractères)

        // When / Then — l'inscription est rejetée par la politique de mot de passe
        assertThatThrownBy(() -> registerUserUseCase.execute(
                "alice", "alice@example.com", "short",
                65, Gender.MALE, 30, 175.0, 70.0, "MONDAY", null))
                .isInstanceOf(WeakPasswordException.class);
    }

    @Test
    void should_throw_when_height_is_zero() {
        // Given
        double height = 0;

        // When / Then
        assertThatThrownBy(() -> registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                65, Gender.MALE, 30, height, 70.0, "MONDAY", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_throw_when_height_is_negative() {
        // Given
        double height = -5;

        // When / Then
        assertThatThrownBy(() -> registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                65, Gender.MALE, 30, height, 70.0, "MONDAY", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_throw_when_start_weight_is_zero() {
        // Given
        double startWeight = 0;

        // When / Then
        assertThatThrownBy(() -> registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                65, Gender.MALE, 30, 175.0, startWeight, "MONDAY", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_throw_when_start_weight_is_negative() {
        // Given
        double startWeight = -10;

        // When / Then
        assertThatThrownBy(() -> registerUserUseCase.execute(
                "alice", "alice@example.com", "password",
                65, Gender.MALE, 30, 175.0, startWeight, "MONDAY", null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
