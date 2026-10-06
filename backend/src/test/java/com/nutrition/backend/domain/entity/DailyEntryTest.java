package com.nutrition.backend.domain.entity;

import com.nutrition.backend.domain.model.Meals;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class DailyEntryTest {

    private static final LocalDate DATE = LocalDate.of(2026, 9, 29);

    @Test
    void should_compute_calories_consumed_as_sum_of_meals_when_created_from_meals() {
        DailyEntry entry = new DailyEntry(null, 1L, DATE, new Meals(400, 700, 150, 600), 0, 0, false);

        assertThat(entry.getCaloriesConsumed()).isEqualTo(1850);
    }

    @Test
    void should_expose_meals_breakdown_when_created_from_meals() {
        Meals meals = new Meals(400, 700, 150, 600);

        DailyEntry entry = new DailyEntry(null, 1L, DATE, meals, 0, 0, false);

        assertThat(entry.getMeals()).isEqualTo(meals);
    }

    @Test
    void should_have_no_meals_when_created_from_legacy_total() {
        DailyEntry entry = new DailyEntry(null, 1L, DATE, 1800, 0, 0, false);

        assertThat(entry.getMeals()).isEqualTo(Meals.none());
        assertThat(entry.getCaloriesConsumed()).isEqualTo(1800);
    }

    @Test
    void should_keep_stored_total_when_reconstituted_without_meals() {
        DailyEntry entry = DailyEntry.reconstitute(5L, 1L, DATE, 1800, Meals.none(), 0, 0, false);

        assertThat(entry.getCaloriesConsumed()).isEqualTo(1800);
    }

    @Test
    void should_use_meals_total_when_reconstituted_with_meals() {
        DailyEntry entry = DailyEntry.reconstitute(5L, 1L, DATE, 1800, new Meals(300, 0, 0, 500), 0, 0, false);

        assertThat(entry.getCaloriesConsumed()).isEqualTo(800);
    }
}
