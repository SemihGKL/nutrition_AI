package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.MealReminder;

import java.time.LocalTime;
import java.util.List;

public interface MealReminderRepository {
    List<MealReminder> findByUserId(Long userId);
    /** Crée ou remplace le réglage de chaque repas fourni (clé : utilisateur + repas). */
    void saveAll(Long userId, List<MealReminder> reminders);
    List<MealReminder> findEnabledAt(LocalTime time);
}
