package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface ObjectiveCompletionJpaRepository extends JpaRepository<ObjectiveCompletionJpaEntity, Long> {
    boolean existsByObjectiveIdAndDate(Long objectiveId, LocalDate date);

    @Transactional
    void deleteByObjectiveIdAndDate(Long objectiveId, LocalDate date);

    List<ObjectiveCompletionJpaEntity> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);

    /**
     * Insertion idempotente : la contrainte uq_objective_completion (objective_id, date)
     * absorbe la course. Sur conflit, une coche MANUAL rend l'existante manuelle ; une
     * coche AUTO ne change rien.
     */
    @Modifying
    @Query(value = """
            INSERT INTO objective_completions (user_id, objective_id, date, source)
            VALUES (:userId, :objectiveId, :date, :source)
            ON CONFLICT (objective_id, date) DO UPDATE SET source = 'MANUAL'
                WHERE EXCLUDED.source = 'MANUAL'
            """, nativeQuery = true)
    void insertIfAbsent(@Param("userId") Long userId,
                        @Param("objectiveId") Long objectiveId,
                        @Param("date") LocalDate date,
                        @Param("source") String source);

    @Modifying
    @Query(value = """
            DELETE FROM objective_completions
            WHERE objective_id = :objectiveId AND date = :date AND source = 'AUTO'
            """, nativeQuery = true)
    void deleteAutomaticCompletion(@Param("objectiveId") Long objectiveId,
                                   @Param("date") LocalDate date);
}
