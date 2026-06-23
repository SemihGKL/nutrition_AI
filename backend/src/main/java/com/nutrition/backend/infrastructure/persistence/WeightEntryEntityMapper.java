package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.WeightEntry;

public class WeightEntryEntityMapper {

    private WeightEntryEntityMapper() {}

    public static WeightEntry toDomain(WeeklyWeighInJpaEntity entity) {
        return new WeightEntry(
                entity.getId(),
                entity.getUser().getId(),
                entity.getDate(),
                entity.getWeight(),
                entity.getNote()
        );
    }

    public static WeeklyWeighInJpaEntity toJpaEntity(WeightEntry entry, UserJpaEntity user) {
        WeeklyWeighInJpaEntity entity = new WeeklyWeighInJpaEntity();
        entity.setId(entry.getId());
        entity.setDate(entry.getDate());
        entity.setWeight(entry.getWeight());
        entity.setNote(entry.getNote());
        entity.setUser(user);
        return entity;
    }
}
