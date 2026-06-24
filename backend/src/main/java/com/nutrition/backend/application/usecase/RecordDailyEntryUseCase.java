package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.springframework.stereotype.Component;

@Component
public class RecordDailyEntryUseCase {

    private final DailyEntryRepository dailyEntryRepository;
    private final AutoCompleteObjectivesUseCase autoCompleteObjectivesUseCase;

    public RecordDailyEntryUseCase(DailyEntryRepository dailyEntryRepository,
                                   AutoCompleteObjectivesUseCase autoCompleteObjectivesUseCase) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.autoCompleteObjectivesUseCase = autoCompleteObjectivesUseCase;
    }

    public DailyEntry execute(DailyEntry entry) {
        DailyEntry saved = dailyEntryRepository.save(entry);
        autoCompleteObjectivesUseCase.execute(entry.getUserId(), entry.getDate(), entry.getCaloriesBurned());
        return saved;
    }
}
