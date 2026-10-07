package com.nutrition.backend.domain.entity;

import com.nutrition.backend.domain.model.MealType;

import java.time.LocalTime;

/** Rappel push pour renseigner un repas, à l'heure habituelle de ce repas. */
public record MealReminder(Long userId, MealType meal, LocalTime time, boolean enabled) {

    public static MealReminder defaultFor(Long userId, MealType meal) {
        return new MealReminder(userId, meal, meal.defaultTime(), false);
    }

    public MealReminder forUser(Long userId) {
        return new MealReminder(userId, meal, time, enabled);
    }
}
