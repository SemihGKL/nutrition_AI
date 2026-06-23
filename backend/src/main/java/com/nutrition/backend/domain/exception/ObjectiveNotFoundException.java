package com.nutrition.backend.domain.exception;

public class ObjectiveNotFoundException extends RuntimeException {
    public ObjectiveNotFoundException(Long id) {
        super("Objectif introuvable avec l'ID : " + id);
    }
}
