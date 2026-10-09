package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
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
        @PositiveOrZero @Max(MAX_TOTAL_KCAL) int caloriesConsumed,
        @PositiveOrZero @Max(MAX_STEPS) int steps,
        @PositiveOrZero @Max(MAX_BURNED_KCAL) int caloriesBurned,
        boolean confirmed,
        @Valid MealsDto meals
) {
    // Bornes larges : elles n'arrêtent que les fautes de frappe (ex. 25 000 kcal).
    // ⚠️ SYNC : frontend/src/utils/limits.ts
    public static final int MAX_TOTAL_KCAL = 20_000;
    public static final int MAX_STEPS = 100_000;
    public static final int MAX_BURNED_KCAL = 10_000;
}
