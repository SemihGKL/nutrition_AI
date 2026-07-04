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

    /** Insertion idempotente : la contrainte uq_objective_completion (objective_id, date) absorbe la course. */
    @Modifying
    @Query(value = """
            INSERT INTO objective_completions (user_id, objective_id, date)
            VALUES (:userId, :objectiveId, :date)
            ON CONFLICT (objective_id, date) DO NOTHING
            """, nativeQuery = true)
    void insertIfAbsent(@Param("userId") Long userId,
                        @Param("objectiveId") Long objectiveId,
                        @Param("date") LocalDate date);
}
