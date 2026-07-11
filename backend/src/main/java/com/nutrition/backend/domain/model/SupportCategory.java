package com.nutrition.backend.domain.model;

public enum SupportCategory {
    PROBLEM("Problème"),
    IMPROVEMENT("Amélioration");

    private final String label;

    SupportCategory(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}