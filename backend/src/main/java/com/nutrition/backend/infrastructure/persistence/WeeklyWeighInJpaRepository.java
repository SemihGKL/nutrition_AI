package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WeeklyWeighInJpaRepository extends JpaRepository<WeeklyWeighInJpaEntity, Long> {
    List<WeeklyWeighInJpaEntity> findByUserIdOrderByDateDesc(Long userId);
}
