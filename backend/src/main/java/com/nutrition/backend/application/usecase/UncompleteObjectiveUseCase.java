package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class UncompleteObjectiveUseCase {

    private final ObjectiveRepository objectiveRepository;
    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public UncompleteObjectiveUseCase(ObjectiveRepository objectiveRepository,
                                      ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveRepository = objectiveRepository;
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public void execute(Long objectiveId, Long requestingUserId, LocalDate date) {
        Objective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new ObjectiveNotFoundException(objectiveId));
        if (!objective.getUserId().equals(requestingUserId)) {
            throw new ObjectiveAccessDeniedException(objectiveId);
        }
        objectiveCompletionRepository.deleteByObjectiveIdAndDate(objectiveId, date);
    }
}
