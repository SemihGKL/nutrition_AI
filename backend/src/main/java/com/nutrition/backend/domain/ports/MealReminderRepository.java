package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.MealReminder;

import com.nutrition.backend.domain.model.MealType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface MealReminderRepository {
    List<MealReminder> findByUserId(Long userId);
    /** Crée ou remplace le réglage de chaque repas fourni (clé : utilisateur + repas). */
    void saveAll(Long userId, List<MealReminder> reminders);
    /** Rappels actifs prévus entre {@code from} et {@code to} (inclus) et pas encore envoyés ce jour-là. */
    List<MealReminder> findDueBetween(LocalTime from, LocalTime to, LocalDate day);

    /** Mémorise l'envoi du jour : un rappel part au plus une fois par jour. */
    void markSent(Long userId, MealType meal, LocalDate day);
}
