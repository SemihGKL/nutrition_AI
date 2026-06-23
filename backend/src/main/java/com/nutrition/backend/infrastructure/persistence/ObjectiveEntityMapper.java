package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;

public class ObjectiveEntityMapper {

    private ObjectiveEntityMapper() {}

    public static Objective toDomain(UserObjectiveJpaEntity entity) {
        return new Objective(
                entity.getId(),
                entity.getUserId(),
                entity.getDayOfWeek(),
                entity.getLabel(),
                entity.getPosition(),
                entity.getType(),
                entity.getTargetValue()
        );
    }

    public static UserObjectiveJpaEntity toJpaEntity(Objective objective) {
        UserObjectiveJpaEntity entity = new UserObjectiveJpaEntity();
        entity.setId(objective.getId());
        entity.setUserId(objective.getUserId());
        entity.setDayOfWeek(objective.getDayOfWeek());
        entity.setLabel(objective.getLabel());
        entity.setPosition(objective.getPosition());
        entity.setType(objective.getType() != null ? objective.getType() : "CUSTOM");
        entity.setTargetValue(objective.getTargetValue());
        return entity;
    }

    public static ObjectiveCompletion completionToDomain(ObjectiveCompletionJpaEntity entity) {
        return new ObjectiveCompletion(
                entity.getId(),
                entity.getUserId(),
                entity.getObjectiveId(),
                entity.getDate()
        );
    }

    public static ObjectiveCompletionJpaEntity completionToJpaEntity(ObjectiveCompletion completion) {
        ObjectiveCompletionJpaEntity entity = new ObjectiveCompletionJpaEntity();
        entity.setId(completion.getId());
        entity.setUserId(completion.getUserId());
        entity.setObjectiveId(completion.getObjectiveId());
        entity.setDate(completion.getDate());
        return entity;
    }
}
