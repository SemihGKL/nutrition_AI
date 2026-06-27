package com.nutrition.backend.domain.model;

public enum ActivityLevel {
    SEDENTARY;

    public double coefficient() {
        return 1.2;
    }
}
