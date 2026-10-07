package com.nutrition.backend.domain.model;

import java.time.LocalTime;

public enum MealType {
    BREAKFAST("Petit-déjeuner", LocalTime.of(8, 0)),
    LUNCH("Déjeuner", LocalTime.of(12, 30)),
    SNACK("Collation", LocalTime.of(16, 30)),
    DINNER("Dîner", LocalTime.of(19, 30));

    private final String label;
    private final LocalTime defaultTime;

    MealType(String label, LocalTime defaultTime) {
        this.label = label;
        this.defaultTime = defaultTime;
    }

    public String label() { return label; }
    public LocalTime defaultTime() { return defaultTime; }
}
