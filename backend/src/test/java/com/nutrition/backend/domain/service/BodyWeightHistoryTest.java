package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.entity.WeightEntry;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class BodyWeightHistoryTest {

    private static final LocalDate DAY = LocalDate.of(2026, 6, 10);
    private static final double START = 90.0;
    private static final double CURRENT = 78.0;

    private static Optional<WeightEntry> weighIn(LocalDate date, double weight) {
        return Optional.of(new WeightEntry(null, 1L, date, weight, null));
    }

    @Test
    void should_return_current_weight_when_no_weigh_in_is_after_the_day() {
        assertThat(BodyWeightHistory.weightOn(weighIn(DAY.minusDays(5), 82.0), false, START, CURRENT))
                .isEqualTo(CURRENT);
        assertThat(BodyWeightHistory.weightOn(Optional.empty(), false, START, CURRENT)).isEqualTo(CURRENT);
    }

    @Test
    void should_return_the_latest_weigh_in_on_or_before_the_day_when_a_later_weigh_in_exists() {
        assertThat(BodyWeightHistory.weightOn(weighIn(DAY.minusDays(1), 84.0), true, START, CURRENT))
                .isEqualTo(84.0);
    }

    @Test
    void should_return_start_weight_when_every_weigh_in_is_after_the_day() {
        assertThat(BodyWeightHistory.weightOn(Optional.empty(), true, START, CURRENT)).isEqualTo(START);
    }
}
