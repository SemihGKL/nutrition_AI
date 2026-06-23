package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.Objective;

import java.util.List;
import java.util.Optional;

public interface ObjectiveRepository {
    List<Objective> findByUserId(Long userId);
    Optional<Objective> findById(Long id);
    Objective save(Objective objective);
    void deleteById(Long id);
}
