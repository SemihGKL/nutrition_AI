package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.DailyCaloriesRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyCaloriesServiceTest {

    @Mock
    private DailyCaloriesRepository dailyCaloriesRepository;

    @InjectMocks
    private DailyCaloriesService dailyCaloriesService;

    @Test
    void should_save_and_return_daily_calories_entry_when_valid_data_is_provided() {
        // Given
        User user = new User();
        user.setUsername("alice");

        DailyCalories entry = new DailyCalories();
        entry.setDate(LocalDate.of(2026, 6, 10));
        entry.setCaloriesConsumed(1800);
        entry.setCaloriesBurned(150);
        entry.setSteps(6000);
        entry.setUser(user);

        when(dailyCaloriesRepository.save(entry)).thenReturn(entry);

        // When
        DailyCalories result = dailyCaloriesService.saveDailyCalories(entry);

        // Then
        assertThat(result.getCaloriesConsumed()).isEqualTo(1800);
        assertThat(result.getCaloriesBurned()).isEqualTo(150);
        assertThat(result.getSteps()).isEqualTo(6000);
        assertThat(result.getDate()).isEqualTo(LocalDate.of(2026, 6, 10));
    }

    @Test
    void should_return_daily_calories_entry_when_entry_exists_for_user_and_date() {
        // Given
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 6, 10);

        DailyCalories entry = new DailyCalories();
        entry.setDate(date);
        entry.setCaloriesConsumed(2000);

        when(dailyCaloriesRepository.findByUserIdAndDate(userId, date)).thenReturn(List.of(entry));

        // When
        List<DailyCalories> result = dailyCaloriesService.getDailyCalories(userId, date);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCaloriesConsumed()).isEqualTo(2000);
        assertThat(result.get(0).getDate()).isEqualTo(date);
    }

    @Test
    void should_return_empty_list_when_no_entry_exists_for_user_and_date() {
        // Given
        Long userId = 2L;
        LocalDate date = LocalDate.of(2026, 6, 10);

        when(dailyCaloriesRepository.findByUserIdAndDate(userId, date)).thenReturn(List.of());

        // When
        List<DailyCalories> result = dailyCaloriesService.getDailyCalories(userId, date);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void should_return_all_daily_calories_entries_when_user_has_multiple_entries() {
        // Given
        Long userId = 1L;

        DailyCalories entry1 = new DailyCalories();
        entry1.setDate(LocalDate.of(2026, 6, 8));
        entry1.setCaloriesConsumed(1600);

        DailyCalories entry2 = new DailyCalories();
        entry2.setDate(LocalDate.of(2026, 6, 9));
        entry2.setCaloriesConsumed(1900);

        DailyCalories entry3 = new DailyCalories();
        entry3.setDate(LocalDate.of(2026, 6, 10));
        entry3.setCaloriesConsumed(2100);

        when(dailyCaloriesRepository.findByUserId(userId)).thenReturn(List.of(entry1, entry2, entry3));

        // When
        List<DailyCalories> result = dailyCaloriesService.getAllDailyCalories(userId);

        // Then
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getCaloriesConsumed()).isEqualTo(1600);
        assertThat(result.get(1).getCaloriesConsumed()).isEqualTo(1900);
        assertThat(result.get(2).getCaloriesConsumed()).isEqualTo(2100);
    }

    @Test
    void should_return_empty_list_when_user_has_no_daily_calories_entries() {
        // Given
        Long userId = 99L;

        when(dailyCaloriesRepository.findByUserId(userId)).thenReturn(List.of());

        // When
        List<DailyCalories> result = dailyCaloriesService.getAllDailyCalories(userId);

        // Then
        assertThat(result).isEmpty();
    }
}
