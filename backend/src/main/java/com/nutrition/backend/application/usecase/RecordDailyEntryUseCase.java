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
        int previousCaloriesBurned = dailyEntryRepository.findByUserIdAndDate(entry.getUserId(), entry.getDate())
                .map(DailyEntry::getCaloriesBurned)
                .orElse(0);
        DailyEntry saved = dailyEntryRepository.save(entry);
        autoCompleteObjectivesUseCase.execute(entry.getUserId(), entry.getDate(),
                previousCaloriesBurned, entry.getCaloriesBurned());
        return saved;
    }
}
