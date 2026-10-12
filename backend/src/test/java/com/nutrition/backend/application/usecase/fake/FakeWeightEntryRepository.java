package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.ports.WeightEntryRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class FakeWeightEntryRepository implements WeightEntryRepository {

    private final Map<Long, WeightEntry> store = new HashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    @Override
    public WeightEntry save(WeightEntry entry) {
        Long id = entry.getId() != null ? entry.getId() : idSequence.getAndIncrement();
        WeightEntry stored = new WeightEntry(id, entry.getUserId(), entry.getDate(),
                entry.getWeight(), entry.getNote());
        store.put(id, stored);
        return stored;
    }

    @Override
    public List<WeightEntry> findByUserIdOrderByDateDesc(Long userId) {
        List<WeightEntry> result = new ArrayList<>();
        for (WeightEntry e : store.values()) {
            if (e.getUserId().equals(userId)) {
                result.add(e);
            }
        }
        result.sort(Comparator.comparing(WeightEntry::getDate).reversed());
        return result;
    }

    @Override
    public java.util.Optional<WeightEntry> findLatestOnOrBefore(Long userId, LocalDate date) {
        return store.values().stream()
                .filter(e -> e.getUserId().equals(userId) && !e.getDate().isAfter(date))
                .max(java.util.Comparator.comparing(WeightEntry::getDate));
    }

    @Override
    public boolean existsAfter(Long userId, LocalDate date) {
        return store.values().stream().anyMatch(e -> e.getUserId().equals(userId) && e.getDate().isAfter(date));
    }
}
