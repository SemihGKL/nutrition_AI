package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class CompleteObjectiveUseCase {

    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public CompleteObjectiveUseCase(ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public void execute(Long objectiveId, Long userId, LocalDate date) {
        if (objectiveCompletionRepository.existsByObjectiveIdAndDate(objectiveId, date)) {
            return;
        }
        ObjectiveCompletion completion = new ObjectiveCompletion(null, userId, objectiveId, date);
        objectiveCompletionRepository.save(completion);
    }
}
