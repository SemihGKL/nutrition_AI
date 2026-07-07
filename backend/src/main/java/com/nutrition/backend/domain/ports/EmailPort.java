package com.nutrition.backend.domain.ports;

public interface EmailPort {
    void sendPasswordResetEmail(String toEmail, String resetLink);
}
