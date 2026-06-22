package com.nutrition.backend.web.dto;

public record CreateObjectiveRequest(int dayOfWeek, String label, String type, Integer targetValue) {
}
