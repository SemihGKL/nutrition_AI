package com.nutrition.backend.domain.entity;

import java.time.Instant;

public record PasswordResetToken(Long id, Long userId, String token, Instant expiresAt, boolean used) {

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used && !isExpired();
    }
}
