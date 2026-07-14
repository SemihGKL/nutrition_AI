package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PushUnsubscribeRequest(@NotBlank String endpoint) {}
