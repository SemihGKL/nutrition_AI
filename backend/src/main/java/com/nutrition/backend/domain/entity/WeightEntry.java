package com.nutrition.backend.domain.entity;

import java.time.LocalDate;

public final class WeightEntry {

    private final Long id;
    private final Long userId;
    private final LocalDate date;
    private final double weight;
    private final String note;

    public WeightEntry(Long id, Long userId, LocalDate date, double weight, String note) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.weight = weight;
        this.note = note;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getDate() { return date; }
    public double getWeight() { return weight; }
    public String getNote() { return note; }

    public WeightEntry withWeight(double weight) {
        return new WeightEntry(id, userId, date, weight, note);
    }
}
