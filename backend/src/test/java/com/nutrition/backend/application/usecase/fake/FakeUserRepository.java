package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.ports.UserRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

public class FakeUserRepository implements UserRepository {

    private final Map<Long, User> store = new HashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    @Override
    public User save(User user) {
        Long id = user.getId() != null ? user.getId() : idSequence.getAndIncrement();
        User stored = new User(id, user.getUsername(), user.getEmail(), user.getPasswordHash(),
                user.getGender(), user.getAge(), user.getHeight(),
                user.getStartWeight(), user.getCurrentWeight(),
                user.getDailyCalorieGoal(), user.getWeightGoal(),
                user.getWeighInDay(), user.getDailyStepsGoal());
        store.put(id, stored);
        return stored;
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return store.values().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst();
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }
}
