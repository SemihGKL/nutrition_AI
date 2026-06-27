package com.nutrition.backend.domain.model;

public record Mbr(double mbr, double tdee, double dailyCalorieGoal) {

    public Mbr {
        if (mbr <= 0) throw new IllegalArgumentException("MBR must be positive");
    }

    public double deficitPercentage(int caloriesConsumed) {
        return ((tdee - caloriesConsumed) / mbr) * 100;
    }
}
