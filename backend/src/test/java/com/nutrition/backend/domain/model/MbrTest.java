package com.nutrition.backend.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MbrTest {

    @Test
    void should_return_deficit_percentage_when_in_deficit() {
        // Given: MBR = 1780, TDEE = 2136, consommé = 1736
        var mbr = new Mbr(1780, 2136, 1780);

        // When
        double result = mbr.deficitPercentage(1736);

        // Then: déficit = 2136 - 1736 = 400, déficit% = (400 / 1780) * 100 = 22.47
        assertEquals(22.47, result, 0.01);
    }

    @Test
    void should_return_negative_percentage_when_in_surplus() {
        // Given: MBR = 1780, TDEE = 2136, consommé = 2500 (surplus)
        var mbr = new Mbr(1780, 2136, 1780);

        // When
        double result = mbr.deficitPercentage(2500);

        // Then: déficit = 2136 - 2500 = -364, déficit% = (-364 / 1780) * 100 = -20.45
        assertEquals(-20.45, result, 0.01);
    }

    @Test
    void should_return_zero_when_calories_equal_tdee() {
        // Given: MBR = 1780, TDEE = 2136, consommé = 2136 (équilibre)
        var mbr = new Mbr(1780, 2136, 1780);

        // When
        double result = mbr.deficitPercentage(2136);

        // Then: déficit = 0, déficit% = 0.0
        assertEquals(0.0, result, 0.01);
    }
}
