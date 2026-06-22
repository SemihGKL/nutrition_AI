package com.nutrition.backend.web.dto;

public record UpdateUserRequest(
        String username,
        String email,
        String gender,
        int age,
        double height,
        double currentWeight,
        String weighInDay,
        Integer dailyCalorieGoal,
        Integer dailyStepsGoal
) {}
