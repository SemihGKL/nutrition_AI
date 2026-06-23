package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserObjectiveJpaRepository extends JpaRepository<UserObjectiveJpaEntity, Long> {
    List<UserObjectiveJpaEntity> findByUserId(Long userId);
}
