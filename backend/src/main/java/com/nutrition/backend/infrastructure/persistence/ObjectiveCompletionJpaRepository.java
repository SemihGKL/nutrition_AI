package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface ObjectiveCompletionJpaRepository extends JpaRepository<ObjectiveCompletionJpaEntity, Long> {
    boolean existsByObjectiveIdAndDate(Long objectiveId, LocalDate date);

    @Transactional
    void deleteByObjectiveIdAndDate(Long objectiveId, LocalDate date);

    List<ObjectiveCompletionJpaEntity> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
}
