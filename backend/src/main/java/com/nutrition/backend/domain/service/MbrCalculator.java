package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;

public class MbrCalculator {

    public Mbr calculate(UserProfile profile) {
        double base = (10 * profile.weightKg()) + (6.25 * profile.heightCm()) - (5 * profile.age());
        double genderConstant = profile.gender() == Gender.MALE ? 5 : -161;
        double mbr = base + genderConstant;
        double tdee = mbr * profile.activityLevel().coefficient();
        double dailyCalorieGoal = tdee - 400;
        return new Mbr(mbr, tdee, dailyCalorieGoal);
    }
}
