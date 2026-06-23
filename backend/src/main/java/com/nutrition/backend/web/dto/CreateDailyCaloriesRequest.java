package com.nutrition.backend.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateDailyCaloriesRequest(
        Long id,
        @NotNull LocalDate date,
        int caloriesConsumed,
        int steps,
        int caloriesBurned,
        boolean confirmed
) {}
