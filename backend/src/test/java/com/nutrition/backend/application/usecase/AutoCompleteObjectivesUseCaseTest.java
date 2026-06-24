package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutoCompleteObjectivesUseCaseTest {

    @Mock
    private ObjectiveRepository objectiveRepository;

    @Mock
    private CompleteObjectiveUseCase completeObjectiveUseCase;

    @InjectMocks
    private AutoCompleteObjectivesUseCase autoCompleteObjectivesUseCase;

    @Test
    void should_complete_sport_objective_automatically_when_calories_burned_is_positive_and_day_of_week_matches() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1; // 0

        Objective sportObj = new Objective(10L, 1L, dow, "Séance sport lundi", 0, "SPORT", null);
        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(sportObj));

        autoCompleteObjectivesUseCase.execute(1L, monday, 300);

        verify(completeObjectiveUseCase).execute(10L, 1L, monday);
    }

    @Test
    void should_not_complete_sport_objective_when_calories_burned_is_zero() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1;

        Objective sportObj = new Objective(10L, 1L, dow, "Séance sport lundi", 0, "SPORT", null);
        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(sportObj));

        autoCompleteObjectivesUseCase.execute(1L, monday, 0);

        verify(completeObjectiveUseCase, never()).execute(anyLong(), anyLong(), any());
    }

    @Test
    void should_not_complete_objective_when_type_is_not_sport() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1;

        Objective customObj = new Objective(20L, 1L, dow, "Boire 2L d'eau", 0, "CUSTOM", null);
        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(customObj));

        autoCompleteObjectivesUseCase.execute(1L, monday, 300);

        verify(completeObjectiveUseCase, never()).execute(anyLong(), anyLong(), any());
    }

    @Test
    void should_not_complete_sport_objective_when_day_of_week_does_not_match_the_stored_objective_day() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        LocalDate tuesday = LocalDate.of(2026, 6, 23);

        Objective sportObj = new Objective(10L, 1L, monday.getDayOfWeek().getValue() - 1, "Séance sport lundi", 0, "SPORT", null);
        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(sportObj));

        autoCompleteObjectivesUseCase.execute(1L, tuesday, 300);

        verify(completeObjectiveUseCase, never()).execute(anyLong(), anyLong(), any());
    }
}
