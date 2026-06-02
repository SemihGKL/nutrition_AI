package com.nutrition.backend.Exception;

public class DailyCaloriesNotFoundException extends RuntimeException {
    public DailyCaloriesNotFoundException(String message) {
        super(message);
    }
}
