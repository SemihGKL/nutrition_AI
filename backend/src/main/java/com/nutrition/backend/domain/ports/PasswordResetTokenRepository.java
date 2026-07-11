package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.PasswordResetToken;

import java.util.Optional;

public interface PasswordResetTokenRepository {
    PasswordResetToken save(PasswordResetToken token);
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUserId(Long userId);
}
