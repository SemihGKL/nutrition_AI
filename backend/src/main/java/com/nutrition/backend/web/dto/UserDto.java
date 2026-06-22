package com.nutrition.backend.web.dto;

public record UserDto(
        Long id,
        String username,
        String email,
        int dailyCalorieGoal,
        int weightGoal,
        String gender,
        int age,
        double height,
        double startWeight,
        double currentWeight,
        String weighInDay,
        Integer dailyStepsGoal
) {}
