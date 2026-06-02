package com.nutrition.backend.web.dto;

public record CreateUserRequest(
        String username,
        String email,
        String password,
        String gender,
        int age,
        double height,
        String activityLevel,
        double startWeight,
        int weightGoal
) {}
