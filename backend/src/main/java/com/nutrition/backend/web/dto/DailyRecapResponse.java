package com.nutrition.backend.web.dto;

import java.time.LocalDate;

public record DailyRecapResponse(
        LocalDate date,
        int caloriesConsumed,
        int caloriesBurned,
        int steps,
        int netCalories,
        int dailyCalorieGoal,
        double mbr,
        double tdee,
        double deficit,
        double deficitPercentage,
        boolean confirmed
) {}
