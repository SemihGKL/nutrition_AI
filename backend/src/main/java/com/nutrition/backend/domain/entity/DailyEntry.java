package com.nutrition.backend.domain.entity;

import com.nutrition.backend.domain.model.Meals;

import java.time.LocalDate;

public final class DailyEntry {

    private final Long id;
    private final Long userId;
    private final LocalDate date;
    private final int caloriesConsumed;
    private final Meals meals;
    private final int steps;
    private final int caloriesBurned;
    private final boolean confirmed;

    private DailyEntry(Long id, Long userId, LocalDate date, int caloriesConsumed, Meals meals,
                       int steps, int caloriesBurned, boolean confirmed) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.caloriesConsumed = caloriesConsumed;
        this.meals = meals;
        this.steps = steps;
        this.caloriesBurned = caloriesBurned;
        this.confirmed = confirmed;
    }

    /** Saisie historique : un total direct, sans détail par repas. */
    public DailyEntry(Long id, Long userId, LocalDate date,
                      int caloriesConsumed, int steps, int caloriesBurned, boolean confirmed) {
        this(id, userId, date, caloriesConsumed, Meals.none(), steps, caloriesBurned, confirmed);
    }

    /** Saisie par repas : le total consommé est la somme des repas. */
    public DailyEntry(Long id, Long userId, LocalDate date,
                      Meals meals, int steps, int caloriesBurned, boolean confirmed) {
        this(id, userId, date, meals.total(), meals, steps, caloriesBurned, confirmed);
    }

    /**
     * Reconstitution depuis la persistance : les entrées antérieures à la saisie
     * par repas n'ont aucun repas renseigné et conservent leur total stocké.
     */
    public static DailyEntry reconstitute(Long id, Long userId, LocalDate date, int storedCaloriesConsumed,
                                          Meals meals, int steps, int caloriesBurned, boolean confirmed) {
        return meals.isEmpty()
                ? new DailyEntry(id, userId, date, storedCaloriesConsumed, steps, caloriesBurned, confirmed)
                : new DailyEntry(id, userId, date, meals, steps, caloriesBurned, confirmed);
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getDate() { return date; }
    public int getCaloriesConsumed() { return caloriesConsumed; }
    public Meals getMeals() { return meals; }
    public int getSteps() { return steps; }
    public int getCaloriesBurned() { return caloriesBurned; }
    public boolean isConfirmed() { return confirmed; }
}
