package com.nutrition.backend.infrastructure.web.dto;

public record ObjectiveDto(Long id, int dayOfWeek, String label, int position, String type, Integer targetValue) {
}
