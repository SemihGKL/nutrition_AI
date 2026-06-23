package com.nutrition.backend.Service;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DailyCaloriesService {

    private final DailyEntryRepository dailyEntryRepository;

    public DailyCaloriesService(DailyEntryRepository dailyEntryRepository) {
        this.dailyEntryRepository = dailyEntryRepository;
    }

    public Optional<DailyEntry> getDailyCalories(Long userId, LocalDate date) {
        return dailyEntryRepository.findByUserIdAndDate(userId, date);
    }

    public List<DailyEntry> getAllDailyCalories(Long userId) {
        return dailyEntryRepository.findByUserId(userId);
    }

    public DailyEntry saveDailyCalories(DailyEntry incoming) {
        return dailyEntryRepository.save(incoming);
    }
}
