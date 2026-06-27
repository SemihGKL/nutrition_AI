package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.exception.InvalidRefreshTokenException;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.domain.ports.UserRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class RefreshAccessTokenUseCase {

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenService tokenService;
    private final UserRepository userRepository;

    public RefreshAccessTokenUseCase(RefreshTokenRepository refreshTokenRepository,
                                     TokenService tokenService,
                                     UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    public record Result(String accessToken, String refreshToken) {}

    public Result execute(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (stored.isExpired()) {
            refreshTokenRepository.deleteByUserId(stored.userId());
            throw new InvalidRefreshTokenException();
        }

        refreshTokenRepository.deleteByUserId(stored.userId());

        String email = userRepository.findById(stored.userId())
                .orElseThrow(InvalidRefreshTokenException::new)
                .getEmail();

        String newAccessToken = tokenService.generateToken(email);

        String newRawToken = UUID.randomUUID().toString();
        RefreshToken newRefreshToken = new RefreshToken(null, stored.userId(), newRawToken, Instant.now().plus(7, ChronoUnit.DAYS));
        refreshTokenRepository.save(newRefreshToken);

        return new Result(newAccessToken, newRawToken);
    }
}
