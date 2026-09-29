package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.model.Meals;

public final class DailyCaloriesEntityMapper {

    private DailyCaloriesEntityMapper() {}

    public static DailyEntry toDomain(DailyCaloriesJpaEntity entity) {
        return DailyEntry.reconstitute(
                entity.getId(),
                entity.getUser().getId(),
                entity.getDate(),
                entity.getCaloriesConsumed(),
                new Meals(entity.getBreakfastKcal(), entity.getLunchKcal(),
                        entity.getSnackKcal(), entity.getDinnerKcal()),
                entity.getSteps(),
                entity.getCaloriesBurned(),
                entity.isConfirmed()
        );
    }

    public static DailyCaloriesJpaEntity toJpaEntity(DailyEntry entry, UserJpaEntity userJpaEntity) {
        DailyCaloriesJpaEntity entity = new DailyCaloriesJpaEntity();
        entity.setId(entry.getId());
        entity.setDate(entry.getDate());
        entity.setCaloriesConsumed(entry.getCaloriesConsumed());
        entity.setBreakfastKcal(entry.getMeals().breakfast());
        entity.setLunchKcal(entry.getMeals().lunch());
        entity.setSnackKcal(entry.getMeals().snack());
        entity.setDinnerKcal(entry.getMeals().dinner());
        entity.setSteps(entry.getSteps());
        entity.setCaloriesBurned(entry.getCaloriesBurned());
        entity.setConfirmed(entry.isConfirmed());
        entity.setUser(userJpaEntity);
        return entity;
    }
}
