package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

public class FakeObjectiveCompletionRepository implements ObjectiveCompletionRepository {

    private final List<ObjectiveCompletion> store = new ArrayList<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    @Override
    public boolean existsByObjectiveIdAndDate(Long objectiveId, LocalDate date) {
        return store.stream()
                .anyMatch(c -> c.getObjectiveId().equals(objectiveId) && c.getDate().equals(date));
    }

    @Override
    public void deleteByObjectiveIdAndDate(Long objectiveId, LocalDate date) {
        store.removeIf(c -> c.getObjectiveId().equals(objectiveId) && c.getDate().equals(date));
    }

    @Override
    public List<ObjectiveCompletion> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to) {
        return store.stream()
                .filter(c -> c.getUserId().equals(userId)
                        && !c.getDate().isBefore(from)
                        && !c.getDate().isAfter(to))
                .toList();
    }

    @Override
    public ObjectiveCompletion save(ObjectiveCompletion completion) {
        Long id = completion.getId() != null ? completion.getId() : idSequence.getAndIncrement();
        ObjectiveCompletion stored = new ObjectiveCompletion(id, completion.getUserId(), completion.getObjectiveId(), completion.getDate());
        store.add(stored);
        return stored;
    }

    public void add(ObjectiveCompletion completion) {
        store.add(completion);
    }

    public List<ObjectiveCompletion> getAll() {
        return List.copyOf(store);
    }
}
