package com.nutrition.backend.web;

import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.web.dto.WeightEntryDto;

public class WeightEntryMapper {

    private WeightEntryMapper() {}

    public static WeightEntryDto toDto(WeightEntry entry) {
        return new WeightEntryDto(
                entry.getId(),
                entry.getUserId(),
                entry.getDate(),
                entry.getWeight(),
                entry.getNote()
        );
    }
}
