package com.nutrition.backend.Exception;

public class ObjectiveAccessDeniedException extends RuntimeException {
    public ObjectiveAccessDeniedException(Long id) {
        super("Accès refusé à l'objectif avec l'ID : " + id);
    }
}
