package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.UserNotFoundException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.MbrCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UpdateUserProfileUseCaseTest {

    private FakeUserRepository userRepository;
    private MbrCalculator mbrCalculator;
    private UpdateUserProfileUseCase updateUserProfileUseCase;

    @BeforeEach
    void setUp() {
        userRepository = new FakeUserRepository();
        mbrCalculator = new MbrCalculator();
        updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository, mbrCalculator);
    }

    private User buildAndSaveUser(String email, Integer dailyStepsGoal) {
        User user = new User(null, "testuser", email, "encoded_pass",
                Gender.MALE, 30, 175.0, 70.0, 70.0, 1800, 65, "MONDAY", dailyStepsGoal);
        return userRepository.save(user);
    }

    @Test
    void should_recalculate_daily_calorie_goal_from_body_metrics_when_no_explicit_goal_is_provided() {
        // Given — male, 28 years, 180cm, 75kg
        // MBR = (10*75) + (6.25*180) - (5*28) + 5 = 750 + 1125 - 140 + 5 = 1740
        // dailyCalorieGoal = round((1740 - 200) / 50) * 50 = round(30.8) * 50 = 31 * 50 = 1550
        User user = buildAndSaveUser("user@example.com", null);
        int expectedCalorieGoal = 1550;

        // When
        User result = updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 28, 180.0, 75.0,
                "MONDAY", null, null, null);

        // Then
        assertThat(result.getDailyCalorieGoal()).isEqualTo(expectedCalorieGoal);
    }

    @Test
    void should_use_explicitly_provided_daily_calorie_goal_instead_of_recalculating_from_mbr_when_goal_is_explicitly_set() {
        // Given
        User user = buildAndSaveUser("user@example.com", null);
        int explicitGoal = 2000;

        // When
        User result = updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 28, 180.0, 75.0,
                "MONDAY", explicitGoal, null, null);

        // Then
        assertThat(result.getDailyCalorieGoal()).isEqualTo(explicitGoal);
    }

    @Test
    void should_preserve_existing_email_when_no_new_email_is_provided_during_profile_update() {
        // Given
        User user = buildAndSaveUser("original@example.com", null);

        // When — email is null (not provided)
        User result = updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 30, 175.0, 70.0,
                "MONDAY", 1800, null, null);

        // Then
        assertThat(result.getEmail()).isEqualTo("original@example.com");
    }

    @Test
    void should_preserve_existing_daily_steps_goal_when_no_new_steps_goal_is_provided_during_profile_update() {
        // Given
        User user = buildAndSaveUser("user@example.com", 8000);

        // When — dailyStepsGoal is null (not provided)
        User result = updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 30, 175.0, 70.0,
                "MONDAY", 1800, null, null);

        // Then
        assertThat(result.getDailyStepsGoal()).isEqualTo(8000);
    }

    @Test
    void should_update_weight_goal_when_a_new_goal_is_provided() {
        // Given — seeded weightGoal = 65
        User user = buildAndSaveUser("user@example.com", null);

        // When
        User result = updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 30, 175.0, 70.0,
                "MONDAY", 1800, null, 60);

        // Then
        assertThat(result.getWeightGoal()).isEqualTo(60);
    }

    @Test
    void should_preserve_existing_weight_goal_when_no_new_goal_is_provided() {
        // Given — seeded weightGoal = 65
        User user = buildAndSaveUser("user@example.com", null);

        // When — weightGoal is null (not provided)
        User result = updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 30, 175.0, 70.0,
                "MONDAY", 1800, null, null);

        // Then
        assertThat(result.getWeightGoal()).isEqualTo(65);
    }

    @Test
    void should_prevent_profile_update_when_user_does_not_exist_in_the_system() {
        // Given — no user in repository
        Long nonExistentId = 999L;

        // When / Then
        assertThatThrownBy(() -> updateUserProfileUseCase.execute(
                nonExistentId, "testuser", "user@example.com", Gender.MALE, 30, 175.0, 70.0,
                "MONDAY", null, null, null))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void should_throw_when_height_is_zero_on_update() {
        // Given
        User user = buildAndSaveUser("user@example.com", null);
        double height = 0;

        // When / Then
        assertThatThrownBy(() -> updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 30, height, 70.0,
                "MONDAY", null, null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_throw_when_current_weight_is_zero_on_update() {
        // Given
        User user = buildAndSaveUser("user@example.com", null);
        double currentWeight = 0;

        // When / Then
        assertThatThrownBy(() -> updateUserProfileUseCase.execute(
                user.getId(), "testuser", null, Gender.MALE, 30, 175.0, currentWeight,
                "MONDAY", null, null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
