package com.nutrition.backend.domain.model;

public enum ActivityLevel {
    SEDENTARY(1.2),
    LIGHTLY_ACTIVE(1.375),
    MODERATELY_ACTIVE(1.55),
    VERY_ACTIVE(1.725),
    EXTREMELY_ACTIVE(1.9);

    private final double coefficient;

    ActivityLevel(double coefficient) {
        this.coefficient = coefficient;
    }

    public double coefficient() {
        return coefficient;
    }
}
