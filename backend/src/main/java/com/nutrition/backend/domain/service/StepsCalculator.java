package com.nutrition.backend.domain.service;

public final class StepsCalculator {

    private StepsCalculator() {}

    public static int toKcal(int steps, double weightKg) {
        int effectiveSteps = Math.max(0, steps - 4000);
        return (int) Math.round(effectiveSteps * (weightKg / 70.0) * 0.025);
    }
}
