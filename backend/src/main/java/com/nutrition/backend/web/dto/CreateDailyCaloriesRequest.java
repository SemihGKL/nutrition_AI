package com.nutrition.backend.web.dto;

import java.time.LocalDate;

public record CreateDailyCaloriesRequest(
        Long userId,
        LocalDate date,
        int caloriesConsumed,
        int steps,
        int caloriesBurned
) {}
