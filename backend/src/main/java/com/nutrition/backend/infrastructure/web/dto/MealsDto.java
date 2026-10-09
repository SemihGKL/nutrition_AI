package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;

public record MealsDto(
        @PositiveOrZero @Max(MAX_MEAL_KCAL) int breakfast,
        @PositiveOrZero @Max(MAX_MEAL_KCAL) int lunch,
        @PositiveOrZero @Max(MAX_MEAL_KCAL) int snack,
        @PositiveOrZero @Max(MAX_MEAL_KCAL) int dinner
) {
    // ⚠️ SYNC : frontend/src/utils/limits.ts
    public static final int MAX_MEAL_KCAL = 5_000;
}
