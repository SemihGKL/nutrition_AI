package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.ports.EmailPort;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;
import com.nutrition.backend.domain.ports.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

public class RequestPasswordResetUseCase {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailPort emailPort;

    public RequestPasswordResetUseCase(UserRepository userRepository,
                                       PasswordResetTokenRepository tokenRepository,
                                       EmailPort emailPort) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailPort = emailPort;
    }

    public void execute(String email, String baseUrl) {
        userRepository.findByEmail(email).ifPresent(user -> {
            tokenRepository.deleteByUserId(user.getId());
            String rawToken = UUID.randomUUID().toString();
            Instant expiresAt = Instant.now().plus(1, ChronoUnit.HOURS);
            PasswordResetToken token = new PasswordResetToken(null, user.getId(), rawToken, expiresAt, false);
            tokenRepository.save(token);
            emailPort.sendPasswordResetEmail(email, baseUrl + "/reset-password?token=" + rawToken);
        });
    }
}
