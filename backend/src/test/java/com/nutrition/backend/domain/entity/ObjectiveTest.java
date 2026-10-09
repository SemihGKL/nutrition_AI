package com.nutrition.backend.domain.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ObjectiveTest {

    private static final LocalDate MONDAY = LocalDate.of(2026, 6, 22);

    private static Objective objective(int dayOfWeek, String type) {
        return new Objective(1L, 1L, dayOfWeek, "x", 0, type, null);
    }

    @Test
    void should_be_auto_completable_on_its_day_of_week_when_sport() {
        assertThat(objective(0, "SPORT").isAutoCompletableOn(MONDAY)).isTrue();
        assertThat(objective(0, "SPORT").isAutoCompletableOn(MONDAY.plusDays(1))).isFalse();
    }

    @Test
    void should_be_auto_completable_every_day_when_daily_sport() {
        assertThat(objective(-1, "SPORT").isAutoCompletableOn(MONDAY)).isTrue();
        assertThat(objective(-1, "SPORT").isAutoCompletableOn(MONDAY.plusDays(4))).isTrue();
    }

    @Test
    void should_never_be_auto_completable_when_not_sport() {
        assertThat(objective(0, "CUSTOM").isAutoCompletableOn(MONDAY)).isFalse();
        assertThat(objective(-1, "CUSTOM").isAutoCompletableOn(MONDAY)).isFalse();
    }
}
