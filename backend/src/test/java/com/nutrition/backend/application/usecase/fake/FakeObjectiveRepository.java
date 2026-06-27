package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class FakeObjectiveRepository implements ObjectiveRepository {

    private final Map<Long, Objective> store = new HashMap<>();

    public void add(Objective objective) {
        store.put(objective.getId(), objective);
    }

    @Override
    public List<Objective> findByUserId(Long userId) {
        return store.values().stream()
                .filter(o -> o.getUserId().equals(userId))
                .toList();
    }

    @Override
    public Optional<Objective> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Objective save(Objective objective) {
        store.put(objective.getId(), objective);
        return objective;
    }

    @Override
    public void deleteById(Long id) {
        store.remove(id);
    }
}
