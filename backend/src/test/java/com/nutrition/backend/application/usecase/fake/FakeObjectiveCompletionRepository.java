package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.model.CompletionSource;
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
        ObjectiveCompletion stored = new ObjectiveCompletion(id, completion.getUserId(), completion.getObjectiveId(),
                completion.getDate(), completion.getSource());
        store.add(stored);
        return stored;
    }

    @Override
    public void insertIfAbsent(ObjectiveCompletion completion) {
        if (!existsByObjectiveIdAndDate(completion.getObjectiveId(), completion.getDate())) {
            save(completion);
            return;
        }
        if (completion.getSource() == CompletionSource.MANUAL) {
            store.replaceAll(c -> c.getObjectiveId().equals(completion.getObjectiveId()) && c.getDate().equals(completion.getDate())
                    ? new ObjectiveCompletion(c.getId(), c.getUserId(), c.getObjectiveId(), c.getDate(), CompletionSource.MANUAL)
                    : c);
        }
    }

    @Override
    public void deleteAutomaticCompletion(Long objectiveId, LocalDate date) {
        store.removeIf(c -> c.getObjectiveId().equals(objectiveId) && c.getDate().equals(date)
                && c.getSource() == CompletionSource.AUTO);
    }

    public void add(ObjectiveCompletion completion) {
        store.add(completion);
    }

    public List<ObjectiveCompletion> getAll() {
        return List.copyOf(store);
    }
}
