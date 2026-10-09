package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

@Component
public class CreateObjectiveUseCase {

    private final ObjectiveRepository objectiveRepository;
    private final GetDailyEntryUseCase getDailyEntryUseCase;
    private final CompleteObjectiveUseCase completeObjectiveUseCase;
    private final Clock clock;

    public CreateObjectiveUseCase(ObjectiveRepository objectiveRepository,
                                  GetDailyEntryUseCase getDailyEntryUseCase,
                                  CompleteObjectiveUseCase completeObjectiveUseCase,
                                  Clock clock) {
        this.clock = clock;
        this.objectiveRepository = objectiveRepository;
        this.getDailyEntryUseCase = getDailyEntryUseCase;
        this.completeObjectiveUseCase = completeObjectiveUseCase;
    }

    public Objective execute(Objective objective) {
        Objective saved = objectiveRepository.save(objective);

        // Jour de l'utilisateur (Europe/Paris), pas celui du serveur (souvent UTC).
        LocalDate today = LocalDate.now(clock);
        if (saved.isAutoCompletableOn(today)) {
            getDailyEntryUseCase.byUserAndDate(saved.getUserId(), today)
                    .filter(entry -> entry.getCaloriesBurned() > 0)
                    .ifPresent(entry -> completeObjectiveUseCase.executeAutomatic(saved.getId(), saved.getUserId(), today));
        }

        return saved;
    }
}
