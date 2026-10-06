package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.entity.WeightEntry;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BodyWeightHistoryTest {

    private static final LocalDate DAY = LocalDate.of(2026, 6, 10);
    private static final double START = 90.0;
    private static final double CURRENT = 78.0;

    private static WeightEntry w(LocalDate date, double weight) {
        return new WeightEntry(null, 1L, date, weight, null);
    }

    @Test
    void should_return_current_weight_when_there_is_no_weigh_in() {
        assertThat(BodyWeightHistory.weightOn(DAY, List.of(), START, CURRENT)).isEqualTo(CURRENT);
    }

    @Test
    void should_return_current_weight_when_no_weigh_in_is_after_the_day() {
        assertThat(BodyWeightHistory.weightOn(DAY, List.of(w(DAY.minusDays(5), 82.0)), START, CURRENT))
                .isEqualTo(CURRENT);
    }

    @Test
    void should_return_latest_weigh_in_on_or_before_the_day_when_a_later_weigh_in_exists() {
        List<WeightEntry> weighIns = List.of(
                w(DAY.plusDays(7), 79.0),
                w(DAY.minusDays(1), 84.0),
                w(DAY.minusDays(8), 86.0));

        assertThat(BodyWeightHistory.weightOn(DAY, weighIns, START, CURRENT)).isEqualTo(84.0);
    }

    @Test
    void should_return_start_weight_when_every_weigh_in_is_after_the_day() {
        assertThat(BodyWeightHistory.weightOn(DAY, List.of(w(DAY.plusDays(1), 85.0)), START, CURRENT))
                .isEqualTo(START);
    }
}
