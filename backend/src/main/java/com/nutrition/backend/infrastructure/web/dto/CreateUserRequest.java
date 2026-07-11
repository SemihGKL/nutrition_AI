package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Size(max = 100) String username,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 72) String password,
        @NotBlank String gender,
        @Positive int age,
        @Positive double height,
        @Positive double startWeight,
        @Positive int weightGoal,
        @NotBlank @Size(max = 10) String weighInDay,
        @PositiveOrZero Integer dailyStepsGoal
) {}
