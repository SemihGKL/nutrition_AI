package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class IssueRefreshTokenUseCase {

    private final RefreshTokenRepository refreshTokenRepository;

    public IssueRefreshTokenUseCase(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public String execute(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        String rawToken = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(null, userId, rawToken, LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }
}
