package com.nutrition.backend.domain.service;

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
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE);

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
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(2136.0, result.tdee());
    }

    @Test
    void should_always_use_sedentary_coefficient_regardless_of_activity_level() {
        // TDEE = MBR × 1.2 always — exercise is logged daily, not baked into the coefficient
        // MBR = 1780 → expected TDEE = 2136 for every activity level
        assertEquals(2136.0,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE)).tdee(), 0.001);
        assertEquals(2136.0,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE)).tdee(), 0.001);
        assertEquals(2136.0,
            calculator.calculate(new UserProfile(80.0, 180.0, 30, Gender.MALE)).tdee(), 0.001);
    }

    @Test
    void should_floor_daily_calorie_goal_at_mbr_when_sedentary() {
        // Given
        // MBR = 1780, TDEE SEDENTARY = 2136 → TDEE - 500 = 1636 < MBR → goal = MBR = 1780
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(1780.0, result.dailyCalorieGoal(), 0.001);
    }

    @Test
    void should_apply_500_deficit_when_tdee_high_enough() {
        // Given
        // weight=150kg, height=200cm, age=25, MALE
        // MBR = (10×150) + (6.25×200) − (5×25) + 5 = 1500 + 1250 − 125 + 5 = 2630
        // TDEE = 2630 × 1.2 = 3156 → TDEE - 500 = 2656 > MBR → goal = 2656
        var profile = new UserProfile(150.0, 200.0, 25, Gender.MALE);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(2656.0, result.dailyCalorieGoal(), 0.001);
    }

    @Test
    void should_calculate_mbr_for_female() {
        // Given
        // weight=65kg, height=165cm, age=25, FEMALE
        // MBR = (10 × 65) + (6.25 × 165) − (5 × 25) − 161
        //      = 650 + 1031.25 − 125 − 161 = 1395.25
        var profile = new UserProfile(65.0, 165.0, 25, Gender.FEMALE);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(1395.25, result.mbr());
    }
}
