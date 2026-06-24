package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import org.springframework.stereotype.Component;

@Component
public class RevokeRefreshTokenUseCase {

    private final RefreshTokenRepository refreshTokenRepository;

    public RevokeRefreshTokenUseCase(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public void execute(String rawRefreshToken) {
        refreshTokenRepository.findByToken(rawRefreshToken)
                .ifPresent(token -> refreshTokenRepository.deleteByUserId(token.userId()));
    }
}
