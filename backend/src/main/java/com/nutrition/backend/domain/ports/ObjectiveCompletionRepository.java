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
     * Insère une complétion de façon idempotente sur (objectiveId, date), sans course
     * check-then-act entre l'auto-complétion SPORT et la coche manuelle.
     * Si une complétion existe déjà, une coche MANUAL la rend manuelle (l'intention de
     * l'utilisateur l'emporte) ; une coche AUTO ne modifie jamais l'existant.
     */
    void insertIfAbsent(ObjectiveCompletion completion);

    /** Retire la complétion de ce jour uniquement si elle a été posée automatiquement. */
    void deleteAutomaticCompletion(Long objectiveId, LocalDate date);
}
