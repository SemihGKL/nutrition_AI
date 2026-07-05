package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;

import java.time.LocalDate;
import java.util.List;

public interface ObjectiveCompletionRepository {
    boolean existsByObjectiveIdAndDate(Long objectiveId, LocalDate date);
    void deleteByObjectiveIdAndDate(Long objectiveId, LocalDate date);
    List<ObjectiveCompletion> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
    ObjectiveCompletion save(ObjectiveCompletion completion);

    /**
     * Insère une complétion de façon idempotente (no-op si (objectiveId, date) existe déjà).
     * Évite la course check-then-act entre l'auto-complétion SPORT et la coche manuelle.
     */
    void insertIfAbsent(ObjectiveCompletion completion);
}
