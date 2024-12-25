package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Service.DailyCaloriesService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDate;
import java.util.List;

public class DailyCaloriesController {
    private final DailyCaloriesService dailyCaloriesService;

    public DailyCaloriesController(DailyCaloriesService dailyCaloriesService) {
        this.dailyCaloriesService = dailyCaloriesService;
    }
    @GetMapping("/{userId}/{date}")
    public List<DailyCalories> getDailyCalories(@PathVariable Long userId, @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        return dailyCaloriesService.getDailyCalories(userId, localDate);
    }

    @GetMapping("/{userId}")
    public List<DailyCalories> getAllDailyCalories(@PathVariable Long userId) {
        return dailyCaloriesService.getAllDailyCalories(userId);
    }

    @PostMapping
    public DailyCalories createDailyCalories(@RequestBody DailyCalories dailyCalories) {
        return dailyCaloriesService.saveDailyCalories(dailyCalories);
    }
}
