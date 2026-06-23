package com.nutrition.backend.Service;

import com.nutrition.backend.application.usecase.GetWeightEntriesUseCase;
import com.nutrition.backend.application.usecase.RecordWeightEntryUseCase;
import com.nutrition.backend.domain.entity.WeightEntry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WeeklyWeighInServiceTest {

    @Mock
    private RecordWeightEntryUseCase recordWeightEntryUseCase;

    @Mock
    private GetWeightEntriesUseCase getWeightEntriesUseCase;

    @InjectMocks
    private WeeklyWeighInService weeklyWeighInService;

    @Test
    public void should_save_weighin_when_valid_data() {
        WeightEntry entry = new WeightEntry(null, 1L, LocalDate.of(2024, 1, 15), 80.5, null);
        WeightEntry saved = new WeightEntry(1L, 1L, LocalDate.of(2024, 1, 15), 80.5, null);

        when(recordWeightEntryUseCase.execute(any(WeightEntry.class))).thenReturn(saved);

        WeightEntry result = weeklyWeighInService.saveWeighIn(entry);

        assertEquals(80.5, result.getWeight());
        assertEquals(LocalDate.of(2024, 1, 15), result.getDate());
    }

    @Test
    public void should_update_user_current_weight_when_saving_weigh_in() {
        WeightEntry entry = new WeightEntry(null, 1L, LocalDate.of(2024, 1, 15), 80.5, null);
        WeightEntry saved = new WeightEntry(1L, 1L, LocalDate.of(2024, 1, 15), 80.5, null);

        when(recordWeightEntryUseCase.execute(any(WeightEntry.class))).thenReturn(saved);

        WeightEntry result = weeklyWeighInService.saveWeighIn(entry);

        assertThat(result.getWeight()).isEqualTo(80.5);
        verify(recordWeightEntryUseCase).execute(entry);
    }

    @Test
    public void should_persist_user_before_weigh_in_when_saving() {
        WeightEntry entry = new WeightEntry(null, 1L, LocalDate.of(2024, 1, 15), 79.0, null);
        WeightEntry saved = new WeightEntry(1L, 1L, LocalDate.of(2024, 1, 15), 79.0, null);

        when(recordWeightEntryUseCase.execute(any(WeightEntry.class))).thenReturn(saved);

        WeightEntry result = weeklyWeighInService.saveWeighIn(entry);

        verify(recordWeightEntryUseCase).execute(entry);
        assertThat(result.getWeight()).isEqualTo(79.0);
    }

    @Test
    public void should_return_all_weighins_for_user() {
        Long userId = 1L;

        WeightEntry e1 = new WeightEntry(1L, userId, LocalDate.of(2024, 1, 22), 80.0, null);
        WeightEntry e2 = new WeightEntry(2L, userId, LocalDate.of(2024, 1, 15), 81.0, null);

        when(getWeightEntriesUseCase.allByUser(userId)).thenReturn(List.of(e1, e2));

        List<WeightEntry> result = weeklyWeighInService.getAllByUser(userId);

        assertEquals(2, result.size());
        assertEquals(80.0, result.get(0).getWeight());
        assertEquals(81.0, result.get(1).getWeight());
    }

    @Test
    public void should_return_latest_weighin_for_user() {
        Long userId = 1L;

        WeightEntry latest = new WeightEntry(1L, userId, LocalDate.of(2024, 1, 22), 80.0, null);

        when(getWeightEntriesUseCase.latestByUser(userId)).thenReturn(Optional.of(latest));

        Optional<WeightEntry> result = weeklyWeighInService.getLatestByUser(userId);

        assertTrue(result.isPresent());
        assertEquals(80.0, result.get().getWeight());
        assertEquals(LocalDate.of(2024, 1, 22), result.get().getDate());
    }

    @Test
    public void should_return_empty_optional_when_no_weighin_exists() {
        Long userId = 99L;
        when(getWeightEntriesUseCase.latestByUser(userId)).thenReturn(Optional.empty());

        Optional<WeightEntry> result = weeklyWeighInService.getLatestByUser(userId);

        assertFalse(result.isPresent());
    }
}
