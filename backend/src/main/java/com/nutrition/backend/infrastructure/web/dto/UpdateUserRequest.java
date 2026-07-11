package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank @Size(max = 100) String username,
        @NotBlank String gender,
        @Positive int age,
        @Positive double height,
        @Positive double currentWeight,
        @NotBlank @Size(max = 10) String weighInDay,
        @Positive Integer dailyCalorieGoal,
        @PositiveOrZero Integer dailyStepsGoal,
        @Positive Integer weightGoal
) {}
