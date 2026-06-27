package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class AutoCompleteObjectivesUseCase {

    private final ObjectiveRepository objectiveRepository;
    private final CompleteObjectiveUseCase completeObjectiveUseCase;

    public AutoCompleteObjectivesUseCase(ObjectiveRepository objectiveRepository,
                                         CompleteObjectiveUseCase completeObjectiveUseCase) {
        this.objectiveRepository = objectiveRepository;
        this.completeObjectiveUseCase = completeObjectiveUseCase;
    }

    public void execute(Long userId, LocalDate date, int caloriesBurned) {
        int dow = date.getDayOfWeek().getValue() - 1; // 0=Lundi ... 6=Dimanche
        for (Objective obj : objectiveRepository.findByUserId(userId)) {
            if ("SPORT".equals(obj.getType()) && (obj.getDayOfWeek() == dow || obj.getDayOfWeek() == -1) && caloriesBurned > 0) {
                completeObjectiveUseCase.execute(obj.getId(), userId, date);
            }
        }
    }
}
