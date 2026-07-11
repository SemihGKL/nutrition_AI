package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.LocalDate;

public record CreateDailyCaloriesRequest(
        Long id,
        @NotNull LocalDate date,
        @PositiveOrZero int caloriesConsumed,
        @PositiveOrZero int steps,
        @PositiveOrZero int caloriesBurned,
        boolean confirmed
) {}
