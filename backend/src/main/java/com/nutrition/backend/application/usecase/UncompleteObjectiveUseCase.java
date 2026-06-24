package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class UncompleteObjectiveUseCase {

    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public UncompleteObjectiveUseCase(ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public void execute(Long objectiveId, Long userId, LocalDate date) {
        objectiveCompletionRepository.deleteByObjectiveIdAndDate(objectiveId, date);
    }
}
