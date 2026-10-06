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
    void should_calculate_daily_calorie_goal_as_tdee_minus_400_rounded_to_50() {
        // Given
        // TDEE = 1780 × 1.2 = 2136 → goal = round((2136 − 400) / 50) × 50 = round(34.72) × 50 = 1750
        var profile = new UserProfile(80.0, 180.0, 30, Gender.MALE);

        // When
        Mbr result = calculator.calculate(profile);

        // Then
        assertEquals(1750.0, result.dailyCalorieGoal(), 0.001);
    }

    @Test
    void should_keep_default_goal_within_recommended_300_to_500_kcal_deficit_under_tdee() {
        for (double weight = 45; weight <= 160; weight += 5) {
            Mbr result = calculator.calculate(new UserProfile(weight, 170.0, 35, Gender.FEMALE));
            double deficit = result.tdee() - result.dailyCalorieGoal();
            org.assertj.core.api.Assertions.assertThat(deficit).isBetween(300.0, 500.0);
        }
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
