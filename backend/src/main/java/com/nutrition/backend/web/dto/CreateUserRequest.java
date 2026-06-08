package com.nutrition.backend.web.dto;

public record CreateUserRequest(
        String username,
        String email,
        String password,
        String gender,
        int age,
        double height,
        double startWeight,
        int weightGoal,
        String weighInDay
) {}
