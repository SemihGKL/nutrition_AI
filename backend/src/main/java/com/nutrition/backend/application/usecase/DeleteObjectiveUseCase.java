package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

@Component
public class DeleteObjectiveUseCase {

    private final ObjectiveRepository objectiveRepository;

    public DeleteObjectiveUseCase(ObjectiveRepository objectiveRepository) {
        this.objectiveRepository = objectiveRepository;
    }

    public void execute(Long objectiveId, Long userId) {
        Objective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new ObjectiveNotFoundException(objectiveId));
        if (!objective.getUserId().equals(userId)) {
            throw new ObjectiveAccessDeniedException(objectiveId);
        }
        objectiveRepository.deleteById(objectiveId);
    }
}
