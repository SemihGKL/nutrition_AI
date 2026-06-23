package com.nutrition.backend.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public record CreateWeighInRequest(
        @NotNull LocalDate date,
        @Positive double weight,
        String note
) {}
