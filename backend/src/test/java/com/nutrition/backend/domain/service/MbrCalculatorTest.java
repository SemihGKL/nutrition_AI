package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.model.ActivityLevel;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MbrCalculatorTest {

    private final MbrCalculator calculator = new MbrCalculator();

    @Test
    void should_calculate_mbr_for_male() {
        // Given
        // weight=80kg, height=180cm, age=30, MALE
        // MBR = (10 × 80) + (6.25 × 180) − (5 × 30) + 5
        //      = 800 + 1125 − 150 + 5 = 1780
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.SEDENTARY);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(1780.0, result.mbr());
    }

    @Test
    void should_calculate_tdee_for_sedentary_activity() {
        // Given
        // weight=80kg, height=180cm, age=30, MALE, SEDENTARY
        // MBR = 1780, TDEE = 1780 × 1.2 = 2136.0
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.SEDENTARY);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(2136.0, result.tdee());
    }

    @Test
    void should_calculate_tdee_for_each_activity_level() {
        // Given — MBR = 1780 (male, 80kg, 180cm, 30ans)
        // SEDENTARY:         1780 × 1.2   = 2136.0
        // LIGHTLY_ACTIVE:    1780 × 1.375 = 2447.5
        // MODERATELY_ACTIVE: 1780 × 1.55  = 2759.0
        // VERY_ACTIVE:       1780 × 1.725 = 3070.5
        // EXTREMELY_ACTIVE:  1780 × 1.9   = 3382.0

        assertEquals(2136.0,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.SEDENTARY)).tdee(), 0.001);
        assertEquals(2447.5,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.LIGHTLY_ACTIVE)).tdee(), 0.001);
        assertEquals(2759.0,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.MODERATELY_ACTIVE)).tdee(), 0.001);
        assertEquals(3070.5,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.VERY_ACTIVE)).tdee(), 0.001);
        assertEquals(3382.0,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.EXTREMELY_ACTIVE)).tdee(), 0.001);
    }

    @Test
    void should_calculate_daily_calorie_goal_as_tdee_minus_default_deficit() {
        // Given
        // MBR = 1780, TDEE SEDENTARY = 2136.0, deficit = 400
        // dailyCalorieGoal = 2136.0 - 400 = 1736.0
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE, ActivityLevel.SEDENTARY);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(1736.0, result.dailyCalorieGoal(), 0.001);
    }

    @Test
    void should_calculate_mbr_for_female() {
        // Given
        // weight=65kg, height=165cm, age=25, FEMALE
        // MBR = (10 × 65) + (6.25 × 165) − (5 × 25) − 161
        //      = 650 + 1031.25 − 125 − 161 = 1395.25
        var profile = new UserProfile(65.0, 165.0, 25, Gender.FEMALE, ActivityLevel.SEDENTARY);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(1395.25, result.mbr());
    }
}
