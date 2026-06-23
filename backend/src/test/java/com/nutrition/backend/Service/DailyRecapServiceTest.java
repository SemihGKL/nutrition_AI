package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyRecapServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private DailyCaloriesService dailyCaloriesService;

    private DailyRecapService dailyRecapService;

    @BeforeEach
    void setUp() {
        dailyRecapService = new DailyRecapService(userService, dailyCaloriesService,
                new com.nutrition.backend.domain.service.MbrCalculator());
    }

    private User maleUser80kg180cm30y() {
        return new User(1L, "john", "john@mail.fr", null, Gender.MALE, 30, 180.0,
                80.0, 80.0, 1780, 75, null, null);
    }

    @Test
    void should_return_recap_with_deficit_percentage_when_entry_exists() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 1);

        DailyCalories entry = new DailyCalories();
        entry.setCaloriesConsumed(1736);
        entry.setCaloriesBurned(200);
        entry.setSteps(8000);
        entry.setDate(date);
        entry.setConfirmed(false);

        when(userService.getUserById(userId)).thenReturn(maleUser80kg180cm30y());
        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(Optional.of(entry));

        DailyRecapResponse recap = dailyRecapService.getRecap(userId, date);

        assertThat(recap.date()).isEqualTo(date);
        assertThat(recap.caloriesConsumed()).isEqualTo(1736);
        assertThat(recap.caloriesBurned()).isEqualTo(200);
        assertThat(recap.steps()).isEqualTo(8000);
        // effectiveSteps = max(0, 8000 - 4000) = 4000
        // stepsKcal = round(4000 × (80/70) × 0.025) = 114
        // netCalories = 1736 - 200 - 114 = 1422
        assertThat(recap.stepsKcal()).isEqualTo(114);
        assertThat(recap.netCalories()).isEqualTo(1422);
        assertThat(recap.dailyCalorieGoal()).isEqualTo(1780);
        assertThat(recap.mbr()).isEqualTo(1780.0);
        assertThat(recap.tdee()).isEqualTo(2136.0);
        assertThat(recap.deficit()).isEqualTo(714.0);
        assertThat(recap.deficitPercentage()).isCloseTo(40.11, org.assertj.core.data.Offset.offset(0.01));
        assertThat(recap.confirmed()).isFalse();
    }

    @Test
    void should_return_recap_with_negative_deficit_when_in_surplus() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 2);

        DailyCalories entry = new DailyCalories();
        entry.setCaloriesConsumed(2500);
        entry.setCaloriesBurned(0);
        entry.setSteps(0);
        entry.setDate(date);
        entry.setConfirmed(false);

        when(userService.getUserById(userId)).thenReturn(maleUser80kg180cm30y());
        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(Optional.of(entry));

        DailyRecapResponse recap = dailyRecapService.getRecap(userId, date);

        assertThat(recap.netCalories()).isEqualTo(2500);
        assertThat(recap.deficit()).isEqualTo(-364.0);
        assertThat(recap.deficitPercentage()).isNegative();
    }

    @Test
    void should_throw_exception_when_no_entry_for_date() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 3);

        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dailyRecapService.getRecap(userId, date))
                .isInstanceOf(DailyCaloriesNotFoundException.class);
    }

    @Test
    void should_return_zero_steps_kcal_when_steps_are_exactly_at_threshold_of_4000() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 6);

        DailyCalories entry = new DailyCalories();
        entry.setCaloriesConsumed(1800);
        entry.setCaloriesBurned(0);
        entry.setSteps(4000);
        entry.setDate(date);
        entry.setConfirmed(false);

        when(userService.getUserById(userId)).thenReturn(maleUser80kg180cm30y());
        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(Optional.of(entry));

        DailyRecapResponse recap = dailyRecapService.getRecap(userId, date);

        assertThat(recap.steps()).isEqualTo(4000);
        assertThat(recap.stepsKcal()).isEqualTo(0);
        assertThat(recap.netCalories()).isEqualTo(1800);
    }

    @Test
    void should_count_zero_extra_calories_burned_from_steps_when_steps_below_4000_threshold() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 4);

        DailyCalories entry = new DailyCalories();
        entry.setCaloriesConsumed(1900);
        entry.setCaloriesBurned(0);
        entry.setSteps(3999);
        entry.setDate(date);
        entry.setConfirmed(false);

        when(userService.getUserById(userId)).thenReturn(maleUser80kg180cm30y());
        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(Optional.of(entry));

        DailyRecapResponse recap = dailyRecapService.getRecap(userId, date);

        assertThat(recap.steps()).isEqualTo(3999);
        assertThat(recap.stepsKcal()).isEqualTo(0);
        assertThat(recap.netCalories()).isEqualTo(1900);
    }
}
