package com.nutrition.backend.domain.entity;

public final class Objective {

    private final Long id;
    private final Long userId;
    private final int dayOfWeek;
    private final String label;
    private final int position;
    private final String type;
    private final Integer targetValue;

    public Objective(Long id, Long userId, int dayOfWeek, String label, int position, String type, Integer targetValue) {
        this.id = id;
        this.userId = userId;
        this.dayOfWeek = dayOfWeek;
        this.label = label;
        this.position = position;
        this.type = type;
        this.targetValue = targetValue;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public int getDayOfWeek() { return dayOfWeek; }
    public String getLabel() { return label; }
    public int getPosition() { return position; }
    public String getType() { return type; }
    public Integer getTargetValue() { return targetValue; }
}
