package com.nutrition.backend.domain.exception;

public class ObjectiveAccessDeniedException extends RuntimeException {
    public ObjectiveAccessDeniedException(Long id) {
        super("Accès refusé à l'objectif avec l'ID : " + id);
    }
}
