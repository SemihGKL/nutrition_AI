package com.nutrition.backend.web.dto;

import java.time.LocalDate;

public record WeightEntryDto(Long id, Long userId, LocalDate date, double weight, String note) {
}
