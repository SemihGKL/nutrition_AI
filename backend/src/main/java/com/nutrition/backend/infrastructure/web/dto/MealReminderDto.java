package com.nutrition.backend.infrastructure.web.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.nutrition.backend.domain.model.MealType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record MealReminderDto(
        @NotNull MealType meal,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime time,
        boolean enabled
) {}
