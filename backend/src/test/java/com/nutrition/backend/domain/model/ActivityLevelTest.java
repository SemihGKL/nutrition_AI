package com.nutrition.backend.domain.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ActivityLevelTest {

    @Test
    void should_expose_coefficient_1_2_when_activity_level_is_sedentary() {
        assertThat(ActivityLevel.SEDENTARY.coefficient()).isEqualTo(1.2);
    }
}
