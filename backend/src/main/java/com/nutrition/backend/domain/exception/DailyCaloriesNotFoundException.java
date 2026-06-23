package com.nutrition.backend.domain.exception;

public class DailyCaloriesNotFoundException extends RuntimeException {
    public DailyCaloriesNotFoundException(String message) {
        super(message);
    }
}
