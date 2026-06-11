package com.nutrition.backend.Repository;

import com.nutrition.backend.Class.ObjectiveCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface ObjectiveCompletionRepository extends JpaRepository<ObjectiveCompletion, Long> {
    boolean existsByObjectiveIdAndDate(Long objectiveId, LocalDate date);

    @Transactional
    void deleteByObjectiveIdAndDate(Long objectiveId, LocalDate date);

    List<ObjectiveCompletion> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
}
