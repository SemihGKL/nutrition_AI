package com.nutrition.backend.infrastructure.web.dto;

public record CreateObjectiveRequest(int dayOfWeek, String label, String type, Integer targetValue) {
}
