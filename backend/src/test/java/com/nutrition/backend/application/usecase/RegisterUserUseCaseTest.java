package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePasswordEncoder;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.MbrCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RegisterUserUseCaseTest {

    private FakeUserRepository userRepository;
    private FakePasswordEncoder passwordEncoder;
    private MbrCalculator mbrCalculator;
    private RegisterUserUseCase registerUserUseCase;

    @BeforeEach
    void setUp() {
        userRepository = new FakeUserRepository();
        passwordEncoder = new FakePasswordEncoder();
        mbrCalculator = new MbrCalculator();
        registerUserUseCase = new RegisterUserUseCase(userRepository, passwordEncoder, mbrCalculator);
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
                65, Gender.MALE, 30, 175.0, 70.0, "MONDAY");

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
                55, Gender.FEMALE, 30, 175.0, 70.0, "MONDAY");

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
                75, Gender.MALE, 25, 180.0, startWeight, "FRIDAY");

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
                70, Gender.MALE, 28, 178.0, 75.0, "WEDNESDAY");

        // Then
        assertThat(result.getPasswordHash()).isNotEqualTo(rawPassword);
        assertThat(result.getPasswordHash()).isEqualTo("encoded_" + rawPassword);
    }
}
