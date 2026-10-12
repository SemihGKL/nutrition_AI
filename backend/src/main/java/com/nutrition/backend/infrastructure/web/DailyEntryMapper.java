package com.nutrition.backend.infrastructure.web;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.model.Meals;
import com.nutrition.backend.infrastructure.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.infrastructure.web.dto.DailyEntryDto;
import com.nutrition.backend.infrastructure.web.dto.MealsDto;

import java.util.Optional;

public final class DailyEntryMapper {

    private DailyEntryMapper() {}

    public static DailyEntryDto toDto(DailyEntry entry) {
        Meals meals = entry.getMeals();
        return new DailyEntryDto(
                entry.getId(),
                entry.getUserId(),
                entry.getDate(),
                entry.getCaloriesConsumed(),
                new MealsDto(meals.breakfast(), meals.lunch(), meals.snack(), meals.dinner()),
                entry.getSteps(),
                entry.getCaloriesBurned(),
                entry.isConfirmed()
        );
    }

    public static DailyEntry toDomain(CreateDailyCaloriesRequest request, Long userId) {
        // Repas absents (ancien client) ou tous à 0 (ancienne saisie sans détail renvoyée
        // telle quelle par l'app) : le total direct reçu fait foi. Sinon, le total est la
        // somme des repas. Même règle qu'à la relecture en base (DailyEntry.reconstitute).
        Meals meals = Optional.ofNullable(request.meals())
                .map(m -> new Meals(m.breakfast(), m.lunch(), m.snack(), m.dinner()))
                .orElseGet(Meals::none);
        return DailyEntry.reconstitute(request.id(), userId, request.date(), request.caloriesConsumed(),
                meals, request.steps(), request.caloriesBurned(), request.confirmed());
    }
}
