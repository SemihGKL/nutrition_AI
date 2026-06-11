package com.nutrition.backend.Repository;

import com.nutrition.backend.Class.UserObjective;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserObjectiveRepository extends JpaRepository<UserObjective, Long> {
    List<UserObjective> findByUserId(Long userId);
}
