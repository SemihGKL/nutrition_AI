package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.exception.InvalidPasswordResetTokenException;
import com.nutrition.backend.domain.ports.PasswordEncoderPort;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.PasswordPolicy;

public class ResetPasswordUseCase {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final RefreshTokenRepository refreshTokenRepository;

    public ResetPasswordUseCase(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoderPort passwordEncoder,
                                PasswordPolicy passwordPolicy,
                                RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
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

        // Réservation atomique du lien : deux requêtes simultanées ne peuvent pas toutes
        // les deux l'utiliser (la vérification ci-dessus seule laisse passer la seconde).
        if (!tokenRepository.claim(token)) {
            throw new InvalidPasswordResetTokenException();
        }

        var user = userRepository.findById(resetToken.userId()).orElseThrow();
        String encoded = passwordEncoder.encode(newPassword);
        userRepository.save(user.withPasswordHash(encoded));

        // Nouveau mot de passe = toutes les sessions ouvertes sont coupées (dont une session
        // volée, qui sinon se prolongerait indéfiniment par rotation du refresh token).
        refreshTokenRepository.deleteByUserId(user.getId());
    }
}
