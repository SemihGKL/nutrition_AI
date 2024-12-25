package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.DailyCaloriesRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DailyCaloriesService {
    private final DailyCaloriesRepository dailyCaloriesRepository;

    public DailyCaloriesService(DailyCaloriesRepository dailyCaloriesRepository) {
        this.dailyCaloriesRepository = dailyCaloriesRepository;
    }

    public List<DailyCalories> getDailyCalories(Long userId, LocalDate date) {
        return dailyCaloriesRepository.findByUserIdAndDate(userId, date);
    }

    public List<DailyCalories> getAllDailyCalories(Long userId) {
        return dailyCaloriesRepository.findByUserId(userId);
    }

    public DailyCalories saveDailyCalories(DailyCalories dailyCalories) {
        return dailyCaloriesRepository.save(dailyCalories);
    }

}
