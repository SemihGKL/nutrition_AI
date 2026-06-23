package com.nutrition.backend.domain.entity;

import java.time.LocalDate;

public final class ObjectiveCompletion {

    private final Long id;
    private final Long userId;
    private final Long objectiveId;
    private final LocalDate date;

    public ObjectiveCompletion(Long id, Long userId, Long objectiveId, LocalDate date) {
        this.id = id;
        this.userId = userId;
        this.objectiveId = objectiveId;
        this.date = date;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getObjectiveId() { return objectiveId; }
    public LocalDate getDate() { return date; }
}
