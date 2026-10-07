package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record MealsDto(
        @PositiveOrZero int breakfast,
        @PositiveOrZero int lunch,
        @PositiveOrZero int snack,
        @PositiveOrZero int dinner
) {}
