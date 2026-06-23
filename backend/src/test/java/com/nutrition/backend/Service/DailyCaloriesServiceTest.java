package com.nutrition.backend.Service;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyCaloriesServiceTest {

    @Mock
    private DailyEntryRepository dailyEntryRepository;

    @InjectMocks
    private DailyCaloriesService dailyCaloriesService;

    private DailyEntry entry(Long id, Long userId, LocalDate date,
                             int kcal, int burned, int steps) {
        return new DailyEntry(id, userId, date, kcal, steps, burned, false);
    }

    @Test
    void should_insert_new_entry_when_no_existing_entry_for_user_and_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        DailyEntry incoming = entry(null, 1L, date, 1800, 150, 6000);

        when(dailyEntryRepository.save(any(DailyEntry.class))).thenReturn(incoming);

        DailyEntry result = dailyCaloriesService.saveDailyCalories(incoming);

        assertThat(result.getCaloriesConsumed()).isEqualTo(1800);
        assertThat(result.getCaloriesBurned()).isEqualTo(150);
        assertThat(result.getSteps()).isEqualTo(6000);
        assertThat(result.getDate()).isEqualTo(date);
    }

    @Test
    void should_update_existing_entry_when_entry_already_exists_for_user_and_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        DailyEntry updated = entry(42L, 1L, date, 1900, 200, 8000);

        when(dailyEntryRepository.save(any(DailyEntry.class))).thenReturn(updated);

        DailyEntry result = dailyCaloriesService.saveDailyCalories(
                entry(null, 1L, date, 1900, 200, 8000));

        assertThat(result.getId()).isEqualTo(42L);
        assertThat(result.getCaloriesConsumed()).isEqualTo(1900);
        assertThat(result.getCaloriesBurned()).isEqualTo(200);
        assertThat(result.getSteps()).isEqualTo(8000);
    }

    @Test
    void should_return_entry_when_entry_exists_for_user_and_date() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 6, 10);
        DailyEntry entry = entry(1L, userId, date, 2000, 0, 0);

        when(dailyEntryRepository.findByUserIdAndDate(userId, date)).thenReturn(Optional.of(entry));

        Optional<DailyEntry> result = dailyCaloriesService.getDailyCalories(userId, date);

        assertThat(result).isPresent();
        assertThat(result.get().getCaloriesConsumed()).isEqualTo(2000);
        assertThat(result.get().getDate()).isEqualTo(date);
    }

    @Test
    void should_return_empty_when_no_entry_exists_for_user_and_date() {
        Long userId = 2L;
        LocalDate date = LocalDate.of(2026, 6, 10);

        when(dailyEntryRepository.findByUserIdAndDate(userId, date)).thenReturn(Optional.empty());

        Optional<DailyEntry> result = dailyCaloriesService.getDailyCalories(userId, date);

        assertThat(result).isEmpty();
    }

    @Test
    void should_return_all_daily_calories_entries_when_user_has_multiple_entries() {
        Long userId = 1L;

        DailyEntry e1 = entry(1L, userId, LocalDate.of(2026, 6, 8), 1600, 0, 0);
        DailyEntry e2 = entry(2L, userId, LocalDate.of(2026, 6, 9), 1900, 0, 0);
        DailyEntry e3 = entry(3L, userId, LocalDate.of(2026, 6, 10), 2100, 0, 0);

        when(dailyEntryRepository.findByUserId(userId)).thenReturn(List.of(e1, e2, e3));

        List<DailyEntry> result = dailyCaloriesService.getAllDailyCalories(userId);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getCaloriesConsumed()).isEqualTo(1600);
        assertThat(result.get(1).getCaloriesConsumed()).isEqualTo(1900);
        assertThat(result.get(2).getCaloriesConsumed()).isEqualTo(2100);
    }

    @Test
    void should_return_empty_list_when_user_has_no_daily_calories_entries() {
        Long userId = 99L;

        when(dailyEntryRepository.findByUserId(userId)).thenReturn(List.of());

        List<DailyEntry> result = dailyCaloriesService.getAllDailyCalories(userId);

        assertThat(result).isEmpty();
    }
}
