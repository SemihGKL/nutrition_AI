package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Controller.DailyRecapResponse;
import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.domain.model.ActivityLevel;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.service.MbrCalculator;

import java.time.LocalDate;
import java.util.List;

public class DailyRecapService {

    private final UserService userService;
    private final DailyCaloriesService dailyCaloriesService;
    private final MbrCalculator mbrCalculator = new MbrCalculator();

    public DailyRecapService(UserService userService, DailyCaloriesService dailyCaloriesService) {
        this.userService = userService;
        this.dailyCaloriesService = dailyCaloriesService;
    }

    public DailyRecapResponse getRecap(Long userId, LocalDate date) {
        List<DailyCalories> entries = dailyCaloriesService.getDailyCalories(userId, date);
        if (entries.isEmpty()) {
            throw new DailyCaloriesNotFoundException("No daily calories entry found for userId=" + userId + " on " + date);
        }

        User user = userService.getUserById(userId);
        DailyCalories entry = entries.get(0);

        UserProfile profile = new UserProfile(
                user.getCurrentWeight(),
                user.getHeight(),
                user.getAge(),
                Gender.valueOf(user.getGender()),
                ActivityLevel.valueOf(user.getActivityLevel())
        );

        Mbr mbr = mbrCalculator.calculate(profile);

        int netCalories = entry.getCaloriesConsumed() - entry.getCaloriesBurned();
        double deficit = mbr.tdee() - netCalories;
        double deficitPercentage = mbr.deficitPercentage(netCalories);

        return new DailyRecapResponse(
                entry.getDate(),
                entry.getCaloriesConsumed(),
                entry.getCaloriesBurned(),
                entry.getSteps(),
                netCalories,
                user.getDailyCalorieGoal(),
                mbr.mbr(),
                mbr.tdee(),
                deficit,
                deficitPercentage,
                entry.isConfirmed()
        );
    }
}
