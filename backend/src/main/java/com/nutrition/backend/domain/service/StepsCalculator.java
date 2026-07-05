package com.nutrition.backend.domain.service;

// ⚠️ SYNC : dupliqué côté front (frontend/src/utils/format.ts → stepsToKcal) pour
// l'aperçu live. Toute modification de la formule doit être répercutée là-bas.
public final class StepsCalculator {

    private StepsCalculator() {}

    public static int toKcal(int steps, double weightKg) {
        int effectiveSteps = Math.max(0, steps - 4000);
        return (int) Math.round(effectiveSteps * (weightKg / 70.0) * 0.025);
    }
}
