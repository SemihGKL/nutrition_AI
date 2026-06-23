package com.nutrition.backend.infrastructure.web;

import com.nutrition.backend.domain.exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import com.nutrition.backend.domain.exception.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFound(UserNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DailyCaloriesNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDailyCaloriesNotFound(DailyCaloriesNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ObjectiveNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleObjectiveNotFound(ObjectiveNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ObjectiveAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleObjectiveAccessDenied(ObjectiveAccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<Map<String, Object>> handleDateTimeParse(DateTimeParseException ex) {
        return error(HttpStatus.BAD_REQUEST, "Format de date invalide — attendu : yyyy-MM-dd");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", message
        ));
    }
}
