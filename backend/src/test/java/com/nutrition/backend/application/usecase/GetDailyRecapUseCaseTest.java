package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeDailyEntryRepository;
import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.MbrCalculator;
import com.nutrition.backend.infrastructure.web.dto.DailyRecapResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

class GetDailyRecapUseCaseTest {

    // Standard test user: MALE, 30y, 175cm, 70kg
    // MBR = (10*70) + (6.25*175) - (5*30) + 5 = 1648.75
    // TDEE = 1648.75 * 1.2 = 1978.5
    private static final double MBR = 1648.75;
    private static final double TDEE = 1978.5;
    private static final LocalDate TEST_DATE = LocalDate.of(2024, 6, 1);
    private static final Long USER_ID = 1L;

    private FakeDailyEntryRepository dailyEntryRepository;
    private FakeUserRepository userRepository;
    private MbrCalculator mbrCalculator;
    private GetDailyRecapUseCase getDailyRecapUseCase;

    @BeforeEach
    void setUp() {
        dailyEntryRepository = new FakeDailyEntryRepository();
        userRepository = new FakeUserRepository();
        mbrCalculator = new MbrCalculator();
        getDailyRecapUseCase = new GetDailyRecapUseCase(dailyEntryRepository, userRepository, mbrCalculator);

        // Save standard user
        User user = new User(USER_ID, "testuser", "user@example.com", "encoded_pass",
                Gender.MALE, 30, 175.0, 70.0, 70.0, 1450, 65, "MONDAY", null);
        userRepository.save(user);
    }

    private void saveDailyEntry(int caloriesConsumed, int steps, int caloriesBurned) {
        DailyEntry entry = new DailyEntry(null, USER_ID, TEST_DATE,
                caloriesConsumed, steps, caloriesBurned, false);
        dailyEntryRepository.save(entry);
    }

    @Test
    void should_compute_net_calories_as_consumed_minus_burned_minus_steps_calories_when_all_values_are_positive() {
        // Given — 10000 steps with 70kg user: effectiveSteps=6000, stepsKcal=round(6000*(70/70)*0.025)=150
        // netCalories = 2000 - 300 - 150 = 1550
        saveDailyEntry(2000, 10000, 300);

        // When
        DailyRecapResponse result = getDailyRecapUseCase.execute(USER_ID, TEST_DATE);

        // Then
        assertThat(result.netCalories()).isEqualTo(1550);
        assertThat(result.stepsKcal()).isEqualTo(150);
    }

    @Test
    void should_compute_zero_steps_calories_when_steps_are_below_the_threshold_of_4000() {
        // Given — 3000 steps: effectiveSteps=max(0, 3000-4000)=0, stepsKcal=0
        // netCalories = 1800 - 200 - 0 = 1600
        saveDailyEntry(1800, 3000, 200);

        // When
        DailyRecapResponse result = getDailyRecapUseCase.execute(USER_ID, TEST_DATE);

        // Then
        assertThat(result.stepsKcal()).isEqualTo(0);
        assertThat(result.netCalories()).isEqualTo(1600);
    }

    @Test
    void should_include_mbr_and_tdee_values_in_recap_based_on_user_body_metrics() {
        // Given
        saveDailyEntry(2000, 8000, 300);

        // When
        DailyRecapResponse result = getDailyRecapUseCase.execute(USER_ID, TEST_DATE);

        // Then
        assertThat(result.mbr()).isCloseTo(MBR, within(0.01));
        assertThat(result.tdee()).isCloseTo(TDEE, within(0.01));
    }

    @Test
    void should_compute_deficit_as_difference_between_tdee_and_net_calories_in_daily_recap() {
        // Given — 8000 steps: effectiveSteps=4000, stepsKcal=round(4000*(70/70)*0.025)=100
        // netCalories = 2000 - 300 - 100 = 1600
        // deficit = 1978.5 - 1600 = 378.5
        saveDailyEntry(2000, 8000, 300);

        // When
        DailyRecapResponse result = getDailyRecapUseCase.execute(USER_ID, TEST_DATE);

        // Then
        // stepsKcal = round(4000 * (70/70) * 0.025) = round(100) = 100
        assertThat(result.stepsKcal()).isEqualTo(100);
        assertThat(result.netCalories()).isEqualTo(1600);
        assertThat(result.deficit()).isCloseTo(TDEE - 1600, within(0.01));
    }

    @Test
    void should_compute_deficit_percentage_relative_to_mbr_value_in_daily_recap() {
        // Given — same as test 4: netCalories = 1600
        // deficitPercentage = ((TDEE - netCalories) / MBR) * 100
        //                   = ((1978.5 - 1600) / 1648.75) * 100
        //                   = (378.5 / 1648.75) * 100
        //                   ≈ 22.96%
        saveDailyEntry(2000, 8000, 300);
        double expectedDeficitPercentage = ((TDEE - 1600) / MBR) * 100;

        // When
        DailyRecapResponse result = getDailyRecapUseCase.execute(USER_ID, TEST_DATE);

        // Then
        assertThat(result.deficitPercentage()).isCloseTo(expectedDeficitPercentage, within(0.01));
    }

    @Test
    void should_prevent_recap_computation_when_no_daily_entry_exists_for_the_requested_date() {
        // Given — no entry saved for TEST_DATE

        // When / Then
        assertThatThrownBy(() -> getDailyRecapUseCase.execute(USER_ID, TEST_DATE))
                .isInstanceOf(DailyCaloriesNotFoundException.class);
    }
}
