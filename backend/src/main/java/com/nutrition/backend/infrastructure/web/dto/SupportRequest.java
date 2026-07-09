package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportRequest(
        @NotBlank String category,
        @NotBlank @Size(max = 2000) String message
) {}
