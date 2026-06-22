package com.nutrition.backend.web;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.web.dto.UserDto;

public final class UserMapper {

    private UserMapper() {}

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDailyCalorieGoal(),
                user.getWeightGoal(),
                user.getGender(),
                user.getAge(),
                user.getHeight(),
                user.getStartWeight(),
                user.getCurrentWeight(),
                user.getWeighInDay(),
                user.getDailyStepsGoal()
        );
    }
}
