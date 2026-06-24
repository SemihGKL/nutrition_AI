package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeDailyEntryRepository;
import com.nutrition.backend.application.usecase.fake.SpyAutoCompleteObjectivesUseCase;
import com.nutrition.backend.domain.entity.DailyEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class RecordDailyEntryUseCaseTest {

    private FakeDailyEntryRepository dailyEntryRepository;
    private SpyAutoCompleteObjectivesUseCase spyAutoComplete;
    private RecordDailyEntryUseCase recordDailyEntryUseCase;

    @BeforeEach
    void setUp() {
        dailyEntryRepository = new FakeDailyEntryRepository();
        spyAutoComplete = new SpyAutoCompleteObjectivesUseCase();
        recordDailyEntryUseCase = new RecordDailyEntryUseCase(dailyEntryRepository, spyAutoComplete);
    }

    @Test
    void should_save_daily_entry_and_return_it_when_recording_a_daily_entry() {
        // Given
        DailyEntry entry = new DailyEntry(null, 1L, LocalDate.of(2024, 6, 1), 2000, 8000, 300, false);

        // When
        DailyEntry result = recordDailyEntryUseCase.execute(entry);

        // Then
        assertThat(result.getId()).isNotNull();
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getCaloriesConsumed()).isEqualTo(2000);
        assertThat(result.getSteps()).isEqualTo(8000);
        assertThat(result.getCaloriesBurned()).isEqualTo(300);
        assertThat(result.getDate()).isEqualTo(LocalDate.of(2024, 6, 1));
    }

    @Test
    void should_trigger_objective_auto_completion_after_saving_daily_entry_when_calories_burned_are_recorded() {
        // Given
        Long userId = 5L;
        LocalDate date = LocalDate.of(2024, 6, 3);
        int caloriesBurned = 450;
        DailyEntry entry = new DailyEntry(null, userId, date, 1800, 10000, caloriesBurned, false);

        // When
        recordDailyEntryUseCase.execute(entry);

        // Then
        assertThat(spyAutoComplete.wasExecuted()).isTrue();
        assertThat(spyAutoComplete.getCapturedUserId()).isEqualTo(userId);
        assertThat(spyAutoComplete.getCapturedDate()).isEqualTo(date);
        assertThat(spyAutoComplete.getCapturedCaloriesBurned()).isEqualTo(caloriesBurned);
    }
}
