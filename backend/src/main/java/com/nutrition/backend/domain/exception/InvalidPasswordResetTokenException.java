package com.nutrition.backend.domain.exception;

public class InvalidPasswordResetTokenException extends RuntimeException {

    public InvalidPasswordResetTokenException() {
        super("Token de réinitialisation invalide ou expiré");
    }
}
