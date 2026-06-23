package com.nutrition.backend.domain.entity;

import java.time.LocalDate;

public final class DailyEntry {

    private final Long id;
    private final Long userId;
    private final LocalDate date;
    private final int caloriesConsumed;
    private final int steps;
    private final int caloriesBurned;
    private final boolean confirmed;

    public DailyEntry(Long id, Long userId, LocalDate date,
                      int caloriesConsumed, int steps, int caloriesBurned, boolean confirmed) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.caloriesConsumed = caloriesConsumed;
        this.steps = steps;
        this.caloriesBurned = caloriesBurned;
        this.confirmed = confirmed;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getDate() { return date; }
    public int getCaloriesConsumed() { return caloriesConsumed; }
    public int getSteps() { return steps; }
    public int getCaloriesBurned() { return caloriesBurned; }
    public boolean isConfirmed() { return confirmed; }

    public DailyEntry withCaloriesConsumed(int caloriesConsumed) {
        return new DailyEntry(id, userId, date, caloriesConsumed, steps, caloriesBurned, confirmed);
    }

    public DailyEntry withSteps(int steps) {
        return new DailyEntry(id, userId, date, caloriesConsumed, steps, caloriesBurned, confirmed);
    }

    public DailyEntry withCaloriesBurned(int caloriesBurned) {
        return new DailyEntry(id, userId, date, caloriesConsumed, steps, caloriesBurned, confirmed);
    }

    public DailyEntry withConfirmed(boolean confirmed) {
        return new DailyEntry(id, userId, date, caloriesConsumed, steps, caloriesBurned, confirmed);
    }

    public static DailyEntry merge(DailyEntry existing, DailyEntry incoming) {
        return new DailyEntry(
                existing.id,
                existing.userId,
                existing.date,
                incoming.caloriesConsumed,
                incoming.steps,
                incoming.caloriesBurned,
                incoming.confirmed
        );
    }
}
