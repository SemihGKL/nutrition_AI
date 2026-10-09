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
     * Synchronise les objectifs SPORT du jour avec la séance saisie :
     * - une séance qui apparaît (kcal brûlées 0 → > 0) coche automatiquement l'objectif ;
     * - une séance retirée (→ 0) enlève cette coche automatique (jamais une coche manuelle) ;
     * - une séance simplement modifiée ne touche à rien : un objectif décoché à la main
     *   reste décoché.
     */
    public void execute(Long userId, LocalDate date, int previousCaloriesBurned, int caloriesBurned) {
        boolean sessionAdded = previousCaloriesBurned == 0 && caloriesBurned > 0;
        boolean sessionRemoved = caloriesBurned == 0;
        if (!sessionAdded && !sessionRemoved) return;

        for (Objective obj : objectiveRepository.findByUserId(userId)) {
            if (!obj.isAutoCompletableOn(date)) continue;
            if (sessionAdded) {
                completeObjectiveUseCase.executeAutomatic(obj.getId(), userId, date);
            } else {
                objectiveCompletionRepository.deleteAutomaticCompletion(obj.getId(), date);
            }
        }
    }
}
