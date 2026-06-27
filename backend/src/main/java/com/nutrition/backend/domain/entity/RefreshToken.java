package com.nutrition.backend.domain.entity;

import java.time.Instant;

public record RefreshToken(Long id, Long userId, String token, Instant expiresAt) {

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
