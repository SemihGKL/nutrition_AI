package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.WeightEntry;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeightEntryRepository {
    WeightEntry save(WeightEntry entry);
    List<WeightEntry> findByUserIdOrderByDateDesc(Long userId);

    /** Dernière pesée faite ce jour-là ou avant (sur tout l'historique). */
    Optional<WeightEntry> findLatestOnOrBefore(Long userId, LocalDate date);

    /** Existe-t-il une pesée postérieure à ce jour ? */
    boolean existsAfter(Long userId, LocalDate date);
}
