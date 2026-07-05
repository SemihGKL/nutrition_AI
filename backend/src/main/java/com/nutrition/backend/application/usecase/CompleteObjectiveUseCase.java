package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class CompleteObjectiveUseCase {

    private final ObjectiveRepository objectiveRepository;
    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public CompleteObjectiveUseCase(ObjectiveRepository objectiveRepository, ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveRepository = objectiveRepository;
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public void execute(Long objectiveId, Long userId, LocalDate date) {
        Objective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new ObjectiveNotFoundException(objectiveId));

        if (!objective.getUserId().equals(userId)) {
            throw new ObjectiveAccessDeniedException(objectiveId);
        }

        // Insertion idempotente : plus de check-then-act. Deux appels concurrents
        // (auto-complétion SPORT + coche manuelle) ne lèvent plus de 409.
        ObjectiveCompletion completion = new ObjectiveCompletion(null, userId, objectiveId, date);
        objectiveCompletionRepository.insertIfAbsent(completion);
    }
}
