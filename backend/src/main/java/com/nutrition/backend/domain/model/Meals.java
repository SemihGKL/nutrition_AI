package com.nutrition.backend.domain.model;

public record Meals(int breakfast, int lunch, int snack, int dinner) {

    public static Meals none() {
        return new Meals(0, 0, 0, 0);
    }

    public int total() {
        return breakfast + lunch + snack + dinner;
    }

    public boolean isEmpty() {
        return total() == 0;
    }
}
