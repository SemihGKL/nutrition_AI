package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class GetDailyEntryUseCase {

    private final DailyEntryRepository dailyEntryRepository;

    public GetDailyEntryUseCase(DailyEntryRepository dailyEntryRepository) {
        this.dailyEntryRepository = dailyEntryRepository;
    }

    public Optional<DailyEntry> byUserAndDate(Long userId, LocalDate date) {
        return dailyEntryRepository.findByUserIdAndDate(userId, date);
    }

    public List<DailyEntry> allByUser(Long userId) {
        return dailyEntryRepository.findByUserId(userId);
    }
}
