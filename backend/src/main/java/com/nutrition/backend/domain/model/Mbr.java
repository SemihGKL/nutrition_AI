package com.nutrition.backend.domain.model;

public record Mbr(double mbr, double tdee, double dailyCalorieGoal) {

    public double deficitPercentage(int caloriesConsumed) {
        return ((tdee - caloriesConsumed) / mbr) * 100;
    }
}
