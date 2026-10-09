package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.application.usecase.AutoCompleteObjectivesUseCase;

import java.time.LocalDate;

public class SpyAutoCompleteObjectivesUseCase extends AutoCompleteObjectivesUseCase {

    private Long capturedUserId;
    private LocalDate capturedDate;
    private Integer capturedPreviousCaloriesBurned;
    private Integer capturedCaloriesBurned;

    public SpyAutoCompleteObjectivesUseCase() {
        super(null, null, null);
    }

    @Override
    public void execute(Long userId, LocalDate date, int previousCaloriesBurned, int caloriesBurned) {
        this.capturedPreviousCaloriesBurned = previousCaloriesBurned;
        this.capturedUserId = userId;
        this.capturedDate = date;
        this.capturedCaloriesBurned = caloriesBurned;
    }

    public Long getCapturedUserId() {
        return capturedUserId;
    }

    public LocalDate getCapturedDate() {
        return capturedDate;
    }

    public Integer getCapturedPreviousCaloriesBurned() {
        return capturedPreviousCaloriesBurned;
    }

    public Integer getCapturedCaloriesBurned() {
        return capturedCaloriesBurned;
    }

    public boolean wasExecuted() {
        return capturedUserId != null;
    }
}
