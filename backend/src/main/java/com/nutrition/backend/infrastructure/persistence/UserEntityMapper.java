package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;

public final class UserEntityMapper {

    private UserEntityMapper() {}

    public static User toDomain(UserJpaEntity entity) {
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getEmail(),
                entity.getPassword(),
                Gender.valueOf(entity.getGender()),
                entity.getAge(),
                entity.getHeight(),
                entity.getStartWeight(),
                entity.getCurrentWeight(),
                entity.getDailyCalorieGoal(),
                entity.getWeightGoal(),
                entity.getWeighInDay(),
                entity.getDailyStepsGoal()
        );
    }

    public static UserJpaEntity toJpaEntity(User user) {
        UserJpaEntity entity = new UserJpaEntity();
        entity.setId(user.getId());
        entity.setUsername(user.getUsername());
        entity.setEmail(user.getEmail());
        entity.setPassword(user.getPasswordHash());
        entity.setGender(user.getGender().name());
        entity.setAge(user.getAge());
        entity.setHeight(user.getHeight());
        entity.setStartWeight(user.getStartWeight());
        entity.setCurrentWeight(user.getCurrentWeight());
        entity.setDailyCalorieGoal(user.getDailyCalorieGoal());
        entity.setWeightGoal(user.getWeightGoal());
        entity.setWeighInDay(user.getWeighInDay());
        entity.setDailyStepsGoal(user.getDailyStepsGoal());
        return entity;
    }
}
