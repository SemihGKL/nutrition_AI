package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.ports.MealReminderRepository;

import com.nutrition.backend.domain.model.MealType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FakeMealReminderRepository implements MealReminderRepository {

    private final List<MealReminder> store = new ArrayList<>();
    private final Map<String, LocalDate> lastSent = new HashMap<>();

    private static String key(Long userId, MealType meal) {
        return userId + ":" + meal;
    }

    @Override
    public List<MealReminder> findByUserId(Long userId) {
        return store.stream().filter(r -> r.userId().equals(userId)).toList();
    }

    @Override
    public void saveAll(Long userId, List<MealReminder> reminders) {
        for (MealReminder r : reminders) {
            store.removeIf(s -> s.userId().equals(userId) && s.meal() == r.meal());
            store.add(r);
        }
    }

    @Override
    public List<MealReminder> findDueBetween(LocalTime from, LocalTime to, LocalDate day) {
        return store.stream()
                .filter(MealReminder::enabled)
                .filter(r -> !r.time().isBefore(from) && !r.time().isAfter(to))
                .filter(r -> java.util.Optional.ofNullable(lastSent.get(key(r.userId(), r.meal())))
                        .map(sent -> sent.isBefore(day))
                        .orElse(true))
                .toList();
    }

    @Override
    public void markSent(Long userId, MealType meal, LocalDate day) {
        lastSent.put(key(userId, meal), day);
    }
}
