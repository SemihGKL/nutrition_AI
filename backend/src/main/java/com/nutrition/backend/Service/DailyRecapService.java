package com.nutrition.backend.Service;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.service.MbrCalculator;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DailyRecapService {

    private final UserService userService;
    private final DailyCaloriesService dailyCaloriesService;
    private final MbrCalculator mbrCalculator;

    public DailyRecapService(UserService userService, DailyCaloriesService dailyCaloriesService, MbrCalculator mbrCalculator) {
        this.userService = userService;
        this.dailyCaloriesService = dailyCaloriesService;
        this.mbrCalculator = mbrCalculator;
    }

    private static int stepsToKcal(int steps, double weightKg) {
        int effectiveSteps = Math.max(0, steps - 4000);
        return (int) Math.round(effectiveSteps * (weightKg / 70.0) * 0.025);
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
                Gender.valueOf(user.getGender())
        );

        Mbr mbr = mbrCalculator.calculate(profile);

        int stepsKcal = stepsToKcal(entry.getSteps(), user.getCurrentWeight());
        int netCalories = entry.getCaloriesConsumed() - entry.getCaloriesBurned() - stepsKcal;
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
