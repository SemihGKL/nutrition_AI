package com.nutrition.backend.Controller;

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
        boolean isConfirmed
) {
}
