package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.ports.MealReminderRepository;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class FakeMealReminderRepository implements MealReminderRepository {

    private final List<MealReminder> store = new ArrayList<>();

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
    public List<MealReminder> findEnabledAt(LocalTime time) {
        return store.stream().filter(r -> r.enabled() && r.time().equals(time)).toList();
    }
}
