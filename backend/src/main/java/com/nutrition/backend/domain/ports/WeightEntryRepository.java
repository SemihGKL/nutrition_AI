package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.WeightEntry;

import java.util.List;

public interface WeightEntryRepository {
    WeightEntry save(WeightEntry entry);
    List<WeightEntry> findByUserIdOrderByDateDesc(Long userId);
}
