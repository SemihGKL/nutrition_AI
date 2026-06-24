package com.nutrition.backend.application.usecase;

import java.time.LocalDate;

public record DailyRecapResult(
        LocalDate date,
        int caloriesConsumed,
        int caloriesBurned,
        int steps,
        int stepsKcal,
        int netCalories,
        int dailyCalorieGoal,
        double mbr,
        double tdee,
        double deficit,
        double deficitPercentage,
        boolean confirmed
) {}
