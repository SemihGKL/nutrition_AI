package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.exception.InvalidPasswordResetTokenException;
import com.nutrition.backend.domain.ports.PasswordEncoderPort;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.PasswordPolicy;

public class ResetPasswordUseCase {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final PasswordPolicy passwordPolicy;

    public ResetPasswordUseCase(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoderPort passwordEncoder,
                                PasswordPolicy passwordPolicy) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
    }

    public void execute(String token, String newPassword) {
        var resetToken = tokenRepository.findByToken(token)
                .orElseThrow(InvalidPasswordResetTokenException::new);

        if (!resetToken.isValid()) {
            throw new InvalidPasswordResetTokenException();
        }

        passwordPolicy.validate(newPassword);

        var user = userRepository.findById(resetToken.userId()).orElseThrow();
        String encoded = passwordEncoder.encode(newPassword);
        userRepository.save(user.withPasswordHash(encoded));

        var usedToken = new PasswordResetToken(
                resetToken.id(), resetToken.userId(), resetToken.token(), resetToken.expiresAt(), true);
        tokenRepository.save(usedToken);
    }
}
