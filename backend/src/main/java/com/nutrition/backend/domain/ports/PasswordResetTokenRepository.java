package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.PasswordResetToken;

import java.util.Optional;

public interface PasswordResetTokenRepository {
    PasswordResetToken save(PasswordResetToken token);
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUserId(Long userId);

    /**
     * Marque le lien comme utilisé s'il est encore valide (non utilisé, non expiré), de façon
     * atomique : sur deux requêtes simultanées, une seule obtient {@code true}.
     */
    boolean claim(String token);
}
