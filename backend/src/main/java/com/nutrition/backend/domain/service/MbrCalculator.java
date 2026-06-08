package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class MbrCalculator {

    private static final int DEFICIT_KCAL = 500;

    public Mbr calculate(UserProfile profile) {
        double base = (10 * profile.weightKg()) + (6.25 * profile.heightCm()) - (5 * profile.age());
        double genderConstant = profile.gender() == Gender.MALE ? 5 : -161;
        double mbr = base + genderConstant;
        double tdee = mbr * 1.2;
        double dailyCalorieGoal = Math.round(Math.max(mbr, tdee - DEFICIT_KCAL));
        return new Mbr(mbr, tdee, dailyCalorieGoal);
    }
}
