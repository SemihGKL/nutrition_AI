package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

public class FakeDailyEntryRepository implements DailyEntryRepository {

    private final Map<Long, DailyEntry> store = new HashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    @Override
    public DailyEntry save(DailyEntry entry) {
        Long id = entry.getId() != null ? entry.getId() : idSequence.getAndIncrement();
        DailyEntry stored = new DailyEntry(id, entry.getUserId(), entry.getDate(),
                entry.getCaloriesConsumed(), entry.getSteps(),
                entry.getCaloriesBurned(), entry.isConfirmed());
        store.put(id, stored);
        return stored;
    }

    @Override
    public Optional<DailyEntry> findByUserIdAndDate(Long userId, LocalDate date) {
        return store.values().stream()
                .filter(e -> e.getUserId().equals(userId) && e.getDate().equals(date))
                .findFirst();
    }

    @Override
    public List<DailyEntry> findByUserId(Long userId) {
        List<DailyEntry> result = new ArrayList<>();
        for (DailyEntry e : store.values()) {
            if (e.getUserId().equals(userId)) {
                result.add(e);
            }
        }
        return result;
    }
}
