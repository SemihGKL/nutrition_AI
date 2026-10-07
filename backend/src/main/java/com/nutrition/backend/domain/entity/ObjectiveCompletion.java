package com.nutrition.backend.domain.entity;

import com.nutrition.backend.domain.model.CompletionSource;

import java.time.LocalDate;

public final class ObjectiveCompletion {

    private final Long id;
    private final Long userId;
    private final Long objectiveId;
    private final LocalDate date;
    private final CompletionSource source;

    public ObjectiveCompletion(Long id, Long userId, Long objectiveId, LocalDate date, CompletionSource source) {
        this.id = id;
        this.userId = userId;
        this.objectiveId = objectiveId;
        this.date = date;
        this.source = source;
    }

    /** Coche faite par l'utilisateur. */
    public ObjectiveCompletion(Long id, Long userId, Long objectiveId, LocalDate date) {
        this(id, userId, objectiveId, date, CompletionSource.MANUAL);
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getObjectiveId() { return objectiveId; }
    public LocalDate getDate() { return date; }
    public CompletionSource getSource() { return source; }
}
