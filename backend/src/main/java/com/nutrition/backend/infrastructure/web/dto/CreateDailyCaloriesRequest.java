package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.LocalDate;

/**
 * {@code meals} est absent pour les clients antérieurs à la saisie par repas
 * (ex. PWA encore en cache) : le total direct {@code caloriesConsumed} fait alors foi.
 */
public record CreateDailyCaloriesRequest(
        Long id,
        @NotNull LocalDate date,
        @PositiveOrZero int caloriesConsumed,
        @PositiveOrZero int steps,
        @PositiveOrZero int caloriesBurned,
        boolean confirmed,
        @Valid MealsDto meals
) {}
