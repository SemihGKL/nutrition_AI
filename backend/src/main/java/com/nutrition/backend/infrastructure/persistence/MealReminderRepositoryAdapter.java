package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.ports.MealReminderRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Component
public class MealReminderRepositoryAdapter implements MealReminderRepository {

    private final MealReminderJpaRepository jpaRepository;

    public MealReminderRepositoryAdapter(MealReminderJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<MealReminder> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId).stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional
    public void saveAll(Long userId, List<MealReminder> reminders) {
        reminders.forEach(r -> jpaRepository.upsert(userId, r.meal().name(), r.time(), r.enabled()));
    }

    @Override
    public List<MealReminder> findEnabledAt(LocalTime time) {
        return jpaRepository.findByEnabledTrueAndReminderTime(time).stream().map(this::toDomain).toList();
    }

    private MealReminder toDomain(MealReminderJpaEntity e) {
        return new MealReminder(e.getUserId(), e.getMeal(), e.getReminderTime(), e.isEnabled());
    }
}
