package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyCaloriesJpaRepository extends JpaRepository<DailyCaloriesJpaEntity, Long> {

    Optional<DailyCaloriesJpaEntity> findByUserIdAndDate(Long userId, LocalDate date);

    List<DailyCaloriesJpaEntity> findByUserId(Long userId);
}
