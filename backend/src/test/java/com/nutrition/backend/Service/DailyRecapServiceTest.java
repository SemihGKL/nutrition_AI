package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

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
        dailyRecapService = new DailyRecapService(userService, dailyCaloriesService, new com.nutrition.backend.domain.service.MbrCalculator());
    }

    @Test
    void should_return_recap_with_deficit_percentage_when_entry_exists() {
        // Given
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 1);

        User user = new User();
        user.setGender("MALE");
        user.setCurrentWeight(80.0);
        user.setHeight(180.0);
        user.setAge(30);
        user.setActivityLevel("SEDENTARY");
        user.setDailyCalorieGoal(1780);

        DailyCalories entry = new DailyCalories();
        entry.setCaloriesConsumed(1736);
        entry.setCaloriesBurned(200);
        entry.setSteps(8000);
        entry.setDate(date);
        entry.setConfirmed(false);

        when(userService.getUserById(userId)).thenReturn(user);
        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(List.of(entry));

        // When
        DailyRecapResponse recap = dailyRecapService.getRecap(userId, date);

        // Then
        assertThat(recap.date()).isEqualTo(date);
        assertThat(recap.caloriesConsumed()).isEqualTo(1736);
        assertThat(recap.caloriesBurned()).isEqualTo(200);
        assertThat(recap.steps()).isEqualTo(8000);
        assertThat(recap.netCalories()).isEqualTo(1536);
        assertThat(recap.dailyCalorieGoal()).isEqualTo(1780);
        assertThat(recap.mbr()).isEqualTo(1780.0);
        assertThat(recap.tdee()).isEqualTo(2136.0);
        assertThat(recap.deficit()).isEqualTo(600.0);
        assertThat(recap.deficitPercentage()).isCloseTo(33.71, org.assertj.core.data.Offset.offset(0.01));
        assertThat(recap.isConfirmed()).isFalse();
    }

    @Test
    void should_return_recap_with_negative_deficit_when_in_surplus() {
        // Given
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 2);

        User user = new User();
        user.setGender("MALE");
        user.setCurrentWeight(80.0);
        user.setHeight(180.0);
        user.setAge(30);
        user.setActivityLevel("SEDENTARY");
        user.setDailyCalorieGoal(1780);

        DailyCalories entry = new DailyCalories();
        entry.setCaloriesConsumed(2500);
        entry.setCaloriesBurned(0);
        entry.setSteps(0);
        entry.setDate(date);
        entry.setConfirmed(false);

        when(userService.getUserById(userId)).thenReturn(user);
        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(List.of(entry));

        // When
        DailyRecapResponse recap = dailyRecapService.getRecap(userId, date);

        // Then
        assertThat(recap.netCalories()).isEqualTo(2500);
        assertThat(recap.deficit()).isEqualTo(-364.0);
        assertThat(recap.deficitPercentage()).isNegative();
    }

    @Test
    void should_throw_exception_when_no_entry_for_date() {
        // Given
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 5, 3);

        when(dailyCaloriesService.getDailyCalories(userId, date)).thenReturn(List.of());

        // When / Then
        assertThatThrownBy(() -> dailyRecapService.getRecap(userId, date))
                .isInstanceOf(DailyCaloriesNotFoundException.class);
    }
}
