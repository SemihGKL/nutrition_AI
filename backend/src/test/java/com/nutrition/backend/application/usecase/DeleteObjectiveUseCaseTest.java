package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteObjectiveUseCaseTest {

    @Mock
    private ObjectiveRepository objectiveRepository;

    @InjectMocks
    private DeleteObjectiveUseCase deleteObjectiveUseCase;

    @Test
    void should_delete_objective_when_objective_belongs_to_the_authenticated_user() {
        Objective objective = new Objective(5L, 1L, 1, "Lire 20 pages", 0, "CUSTOM", null);
        when(objectiveRepository.findById(5L)).thenReturn(Optional.of(objective));

        deleteObjectiveUseCase.execute(5L, 1L);

        verify(objectiveRepository).deleteById(5L);
    }

    @Test
    void should_prevent_deletion_when_objective_does_not_belong_to_the_authenticated_user() {
        Objective objective = new Objective(5L, 2L, 1, "Lire 20 pages", 0, "CUSTOM", null);
        when(objectiveRepository.findById(5L)).thenReturn(Optional.of(objective));

        assertThatThrownBy(() -> deleteObjectiveUseCase.execute(5L, 1L))
                .isInstanceOf(ObjectiveAccessDeniedException.class);

        verify(objectiveRepository, never()).deleteById(anyLong());
    }

    @Test
    void should_prevent_deletion_when_objective_does_not_exist() {
        when(objectiveRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteObjectiveUseCase.execute(99L, 1L))
                .isInstanceOf(ObjectiveNotFoundException.class);

        verify(objectiveRepository, never()).deleteById(anyLong());
    }
}
