package com.nutrition.backend.web.dto;

public record UpdateUserRequest(
        String username,
        String gender,
        int age,
        double height,
        String activityLevel,
        double currentWeight
) {}
