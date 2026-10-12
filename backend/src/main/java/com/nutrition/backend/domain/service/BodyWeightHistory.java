package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.entity.WeightEntry;

import java.util.Optional;

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
    public static double weightOn(Optional<WeightEntry> latestOnOrBefore, boolean hasLaterWeighIn,
                                  double startWeight, double currentWeight) {
        if (!hasLaterWeighIn) return currentWeight;
        return latestOnOrBefore.map(WeightEntry::getWeight).orElse(startWeight);
    }
}
