package com.nutrition.backend.domain.entity;

import java.time.LocalDateTime;

public record RefreshToken(Long id, Long userId, String token, LocalDateTime expiresAt) {

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
