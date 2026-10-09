package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class AutoCompleteObjectivesUseCase {

    private final ObjectiveRepository objectiveRepository;
    private final CompleteObjectiveUseCase completeObjectiveUseCase;
    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public AutoCompleteObjectivesUseCase(ObjectiveRepository objectiveRepository,
                                         CompleteObjectiveUseCase completeObjectiveUseCase,
                                         ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveRepository = objectiveRepository;
        this.completeObjectiveUseCase = completeObjectiveUseCase;
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    /**
     * Synchronise les objectifs SPORT du jour avec la séance saisie : coche automatique
     * quand des calories sont brûlées, retrait de cette coche automatique quand la séance
     * repasse à 0. Une coche manuelle n'est jamais retirée.
     */
    public void execute(Long userId, LocalDate date, int caloriesBurned) {
        for (Objective obj : objectiveRepository.findByUserId(userId)) {
            if (!obj.isAutoCompletableOn(date)) {
                continue;
            }
            if (caloriesBurned > 0) {
                completeObjectiveUseCase.executeAutomatic(obj.getId(), userId, date);
            } else {
                objectiveCompletionRepository.deleteAutomaticCompletion(obj.getId(), date);
            }
        }
    }
}
