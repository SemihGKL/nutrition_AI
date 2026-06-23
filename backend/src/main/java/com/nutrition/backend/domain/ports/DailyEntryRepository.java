package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.DailyEntry;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyEntryRepository {

    Optional<DailyEntry> findByUserIdAndDate(Long userId, LocalDate date);

    List<DailyEntry> findByUserId(Long userId);

    DailyEntry save(DailyEntry entry);
}
