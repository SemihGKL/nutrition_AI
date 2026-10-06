package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.entity.WeightEntry;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Poids à retenir pour un jour donné, pour qu'un récap passé ne change pas à chaque
 * nouvelle pesée.
 */
public final class BodyWeightHistory {

    private BodyWeightHistory() {}

    /**
     * - aucune pesée postérieure au jour → poids courant (état le plus récent connu,
     *   y compris une correction faite dans le profil) ;
     * - sinon, dernière pesée faite ce jour-là ou avant ;
     * - sinon (toutes les pesées sont postérieures) → poids de départ.
     */
    public static double weightOn(LocalDate day, List<WeightEntry> weighIns, double startWeight, double currentWeight) {
        boolean hasLaterWeighIn = weighIns.stream().anyMatch(w -> w.getDate().isAfter(day));
        if (!hasLaterWeighIn) return currentWeight;
        return weighIns.stream()
                .filter(w -> !w.getDate().isAfter(day))
                .max(Comparator.comparing(WeightEntry::getDate))
                .map(WeightEntry::getWeight)
                .orElse(startWeight);
    }
}
