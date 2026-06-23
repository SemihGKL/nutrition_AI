package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.service.ObjectiveService;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.springframework.stereotype.Component;

@Component
public class RecordDailyEntryUseCase {

    private final DailyEntryRepository dailyEntryRepository;
    private final ObjectiveService objectiveService;

    public RecordDailyEntryUseCase(DailyEntryRepository dailyEntryRepository,
                                   ObjectiveService objectiveService) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.objectiveService = objectiveService;
    }

    public DailyEntry execute(DailyEntry entry) {
        DailyEntry saved = dailyEntryRepository.save(entry);
        objectiveService.autoComplete(entry.getUserId(), entry.getDate(), entry.getCaloriesBurned());
        return saved;
    }
}
