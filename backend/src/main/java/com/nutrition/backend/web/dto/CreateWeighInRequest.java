package com.nutrition.backend.web.dto;

import java.time.LocalDate;

public record CreateWeighInRequest(
        LocalDate date,
        double weight,
        String note
) {}
