package com.nutrition.backend.infrastructure.web.dto;

import java.time.LocalDate;

public record DailyEntryDto(
        Long id,
        Long userId,
        LocalDate date,
        int caloriesConsumed,
        int steps,
        int caloriesBurned,
        boolean confirmed
) {}
