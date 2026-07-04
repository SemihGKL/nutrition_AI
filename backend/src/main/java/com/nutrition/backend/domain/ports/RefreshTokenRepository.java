package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.RefreshToken;

import java.util.Optional;

public interface RefreshTokenRepository {
    RefreshToken save(RefreshToken token);
    Optional<RefreshToken> findByToken(String token);
    void deleteByUserId(Long userId);

    /**
     * Remplace atomiquement tous les tokens d'un utilisateur par un nouveau (rotation).
     * Évite la fenêtre "delete puis save" non atomique où un crash laisse l'utilisateur
     * sans aucun token valide.
     */
    void replaceUserTokens(Long userId, RefreshToken newToken);
}
