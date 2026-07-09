package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.exception.WeakPasswordException;

/**
 * Règle métier partagée sur la robustesse minimale d'un mot de passe.
 * <p>
 * Longueur minimale alignée sur le contrôle du frontend (8 caractères) ;
 * longueur maximale bornée à 72 octets, limite au-delà de laquelle BCrypt
 * tronque silencieusement l'entrée.
 */
public class PasswordPolicy {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 72;

    public void validate(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new WeakPasswordException();
        }
        if (rawPassword.length() < MIN_LENGTH || rawPassword.length() > MAX_LENGTH) {
            throw new WeakPasswordException();
        }
    }
}
