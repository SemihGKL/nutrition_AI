package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateObjectiveRequest(
        int dayOfWeek,
        @NotBlank @Size(max = 100) String label,
        @Size(max = 20) String type,
        Integer targetValue) {
}
