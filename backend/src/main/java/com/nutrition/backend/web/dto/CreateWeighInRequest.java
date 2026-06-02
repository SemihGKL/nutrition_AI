package com.nutrition.backend.web.dto;

import java.time.LocalDate;

public record CreateWeighInRequest(
        Long userId,
        LocalDate date,
        double weight,
        String note
) {}
