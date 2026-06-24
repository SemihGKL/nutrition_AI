package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class CreateObjectiveUseCase {

    private final ObjectiveRepository objectiveRepository;
    private final GetDailyEntryUseCase getDailyEntryUseCase;
    private final CompleteObjectiveUseCase completeObjectiveUseCase;

    public CreateObjectiveUseCase(ObjectiveRepository objectiveRepository,
                                  GetDailyEntryUseCase getDailyEntryUseCase,
                                  CompleteObjectiveUseCase completeObjectiveUseCase) {
        this.objectiveRepository = objectiveRepository;
        this.getDailyEntryUseCase = getDailyEntryUseCase;
        this.completeObjectiveUseCase = completeObjectiveUseCase;
    }

    public Objective execute(Objective objective) {
        Objective saved = objectiveRepository.save(objective);

        if ("SPORT".equals(saved.getType())) {
            LocalDate today = LocalDate.now();
            int todayDow = today.getDayOfWeek().getValue() - 1;
            if (saved.getDayOfWeek() == todayDow) {
                getDailyEntryUseCase.byUserAndDate(saved.getUserId(), today)
                        .filter(entry -> entry.getCaloriesBurned() > 0)
                        .ifPresent(entry -> completeObjectiveUseCase.execute(saved.getId(), saved.getUserId(), today));
            }
        }

        return saved;
    }
}
