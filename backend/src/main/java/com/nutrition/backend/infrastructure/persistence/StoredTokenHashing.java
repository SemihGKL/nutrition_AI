package com.nutrition.backend.infrastructure.persistence;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

/**
 * Hache au démarrage tout jeton encore stocké en clair. La migration V21 a converti les
 * jetons existants une fois ; mais après un retour arrière vers une version antérieure
 * (qui stocke en clair), les sessions ouvertes entre-temps seraient perdues au
 * redéploiement. Ce rattrapage rend la conversion rejouable.
 * Les jetons bruts sont des UUID (36 caractères) : ils ne ressemblent jamais à une
 * empreinte SHA-256 (64 caractères hexadécimaux).
 */
@Component
public class StoredTokenHashing {

    private static final Logger log = LoggerFactory.getLogger(StoredTokenHashing.class);
    private static final Pattern SHA256_HEX = Pattern.compile("[0-9a-f]{64}");

    private final RefreshTokenJpaRepository refreshTokenJpaRepository;
    private final PasswordResetTokenJpaRepository passwordResetTokenJpaRepository;

    public StoredTokenHashing(RefreshTokenJpaRepository refreshTokenJpaRepository,
                              PasswordResetTokenJpaRepository passwordResetTokenJpaRepository) {
        this.refreshTokenJpaRepository = refreshTokenJpaRepository;
        this.passwordResetTokenJpaRepository = passwordResetTokenJpaRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void hashTokensStoredInClear() {
        int hashed = 0;
        for (RefreshTokenJpaEntity t : refreshTokenJpaRepository.findAll()) {
            if (isHashed(t.getToken())) continue;
            refreshTokenJpaRepository.save(new RefreshTokenJpaEntity(
                    t.getId(), t.getUserId(), TokenHasher.sha256Hex(t.getToken()), t.getExpiresAt()));
            hashed++;
        }
        for (PasswordResetTokenJpaEntity t : passwordResetTokenJpaRepository.findAll()) {
            if (isHashed(t.getToken())) continue;
            passwordResetTokenJpaRepository.save(new PasswordResetTokenJpaEntity(
                    t.getId(), t.getUserId(), TokenHasher.sha256Hex(t.getToken()), t.getExpiresAt(), t.isUsed()));
            hashed++;
        }
        if (hashed > 0) log.info("[SÉCURITÉ] {} jeton(s) stocké(s) en clair hachés au démarrage", hashed);
    }

    private static boolean isHashed(String token) {
        return SHA256_HEX.matcher(token).matches();
    }
}
