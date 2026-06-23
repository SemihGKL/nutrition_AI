package com.nutrition.backend.infrastructure.web;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.infrastructure.web.dto.DailyEntryDto;

public final class DailyEntryMapper {

    private DailyEntryMapper() {}

    public static DailyEntryDto toDto(DailyEntry entry) {
        return new DailyEntryDto(
                entry.getId(),
                entry.getUserId(),
                entry.getDate(),
                entry.getCaloriesConsumed(),
                entry.getSteps(),
                entry.getCaloriesBurned(),
                entry.isConfirmed()
        );
    }
}
