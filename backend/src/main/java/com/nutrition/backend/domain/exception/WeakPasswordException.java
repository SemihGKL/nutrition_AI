package com.nutrition.backend.domain.exception;

public class WeakPasswordException extends RuntimeException {
    public WeakPasswordException() {
        super("Le mot de passe doit comporter entre 8 et 72 caractères.");
    }
}
