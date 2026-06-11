package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.DailyCaloriesRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DailyCaloriesService {
    private final DailyCaloriesRepository dailyCaloriesRepository;

    public DailyCaloriesService(DailyCaloriesRepository dailyCaloriesRepository) {
        this.dailyCaloriesRepository = dailyCaloriesRepository;
    }

    public Optional<DailyCalories> getDailyCalories(Long userId, LocalDate date) {
        return dailyCaloriesRepository.findByUserIdAndDate(userId, date);
    }

    public List<DailyCalories> getAllDailyCalories(Long userId) {
        return dailyCaloriesRepository.findByUserId(userId);
    }

    public DailyCalories saveDailyCalories(DailyCalories incoming) {
        return dailyCaloriesRepository.findByUserIdAndDate(incoming.getUser().getId(), incoming.getDate())
                .map(existing -> {
                    existing.setCaloriesConsumed(incoming.getCaloriesConsumed());
                    existing.setSteps(incoming.getSteps());
                    existing.setCaloriesBurned(incoming.getCaloriesBurned());
                    existing.setConfirmed(incoming.isConfirmed());
                    return dailyCaloriesRepository.save(existing);
                })
                .orElseGet(() -> dailyCaloriesRepository.save(incoming));
    }

}
