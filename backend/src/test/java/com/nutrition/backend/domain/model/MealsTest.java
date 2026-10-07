package com.nutrition.backend.domain.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MealsTest {

    @Test
    void should_return_sum_of_all_meals_when_computing_total() {
        assertThat(new Meals(400, 700, 150, 600).total()).isEqualTo(1850);
    }

    @Test
    void should_be_empty_when_no_meal_is_filled() {
        assertThat(Meals.none().isEmpty()).isTrue();
    }

    @Test
    void should_not_be_empty_when_one_meal_is_filled() {
        assertThat(new Meals(0, 0, 150, 0).isEmpty()).isFalse();
    }
}