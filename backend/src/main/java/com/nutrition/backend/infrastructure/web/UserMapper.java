package com.nutrition.backend.infrastructure.web;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.infrastructure.web.dto.UserDto;

public final class UserMapper {

    private UserMapper() {}

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDailyCalorieGoal(),
                user.getWeightGoal(),
                user.getGender().name(),
                user.getAge(),
                user.getHeight(),
                user.getStartWeight(),
                user.getCurrentWeight(),
                user.getWeighInDay(),
                user.getDailyStepsGoal()
        );
    }
}
