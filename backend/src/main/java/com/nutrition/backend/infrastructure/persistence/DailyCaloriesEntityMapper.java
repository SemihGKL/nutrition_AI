package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.DailyEntry;

public final class DailyCaloriesEntityMapper {

    private DailyCaloriesEntityMapper() {}

    public static DailyEntry toDomain(DailyCaloriesJpaEntity entity) {
        return new DailyEntry(
                entity.getId(),
                entity.getUser().getId(),
                entity.getDate(),
                entity.getCaloriesConsumed(),
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
        entity.setSteps(entry.getSteps());
        entity.setCaloriesBurned(entry.getCaloriesBurned());
        entity.setConfirmed(entry.isConfirmed());
        entity.setUser(userJpaEntity);
        return entity;
    }
}
