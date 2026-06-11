package com.nutrition.backend.Exception;

public class ObjectiveNotFoundException extends RuntimeException {
    public ObjectiveNotFoundException(Long id) {
        super("Objectif introuvable avec l'ID : " + id);
    }
}
