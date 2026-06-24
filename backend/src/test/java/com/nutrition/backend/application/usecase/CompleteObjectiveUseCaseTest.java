package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompleteObjectiveUseCaseTest {

    @Mock
    private ObjectiveCompletionRepository objectiveCompletionRepository;

    @InjectMocks
    private CompleteObjectiveUseCase completeObjectiveUseCase;

    @Test
    void should_mark_objective_as_done_when_no_completion_exists_for_that_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        when(objectiveCompletionRepository.existsByObjectiveIdAndDate(5L, date)).thenReturn(false);

        completeObjectiveUseCase.execute(5L, 1L, date);

        verify(objectiveCompletionRepository).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_not_create_duplicate_completion_when_objective_is_already_marked_done_for_that_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        when(objectiveCompletionRepository.existsByObjectiveIdAndDate(5L, date)).thenReturn(true);

        completeObjectiveUseCase.execute(5L, 1L, date);

        verify(objectiveCompletionRepository, never()).save(any(ObjectiveCompletion.class));
    }
}
