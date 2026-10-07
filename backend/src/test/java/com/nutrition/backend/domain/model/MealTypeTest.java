package com.nutrition.backend.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class MealTypeTest {

    @Test
    void should_propose_usual_meal_times_by_default() {
        assertThat(MealType.BREAKFAST.defaultTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(MealType.LUNCH.defaultTime()).isEqualTo(LocalTime.of(12, 30));
        assertThat(MealType.SNACK.defaultTime()).isEqualTo(LocalTime.of(16, 30));
        assertThat(MealType.DINNER.defaultTime()).isEqualTo(LocalTime.of(19, 30));
    }

    @Test
    void should_return_calories_of_the_given_meal() {
        Meals meals = new Meals(400, 700, 0, 600);

        assertThat(meals.kcalFor(MealType.BREAKFAST)).isEqualTo(400);
        assertThat(meals.kcalFor(MealType.LUNCH)).isEqualTo(700);
        assertThat(meals.kcalFor(MealType.SNACK)).isZero();
        assertThat(meals.kcalFor(MealType.DINNER)).isEqualTo(600);
    }
}
