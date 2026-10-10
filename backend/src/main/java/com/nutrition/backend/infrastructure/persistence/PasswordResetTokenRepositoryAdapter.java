package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Component
public class PasswordResetTokenRepositoryAdapter implements PasswordResetTokenRepository {

    private final PasswordResetTokenJpaRepository jpaRepository;

    public PasswordResetTokenRepositoryAdapter(PasswordResetTokenJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        PasswordResetTokenJpaEntity entity = new PasswordResetTokenJpaEntity(
                token.id(), token.userId(), TokenHasher.sha256Hex(token.token()), token.expiresAt(), token.used()
        );
        PasswordResetTokenJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved, token.token());
    }

    @Override
    public Optional<PasswordResetToken> findByToken(String token) {
        return jpaRepository.findByToken(TokenHasher.sha256Hex(token)).map(e -> toDomain(e, token));
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        jpaRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public boolean claim(String token) {
        return jpaRepository.claim(TokenHasher.sha256Hex(token), Instant.now()) == 1;
    }

    /** La base ne stocke que l'empreinte : le domaine continue de manipuler le jeton d'origine. */
    private PasswordResetToken toDomain(PasswordResetTokenJpaEntity entity, String rawToken) {
        return new PasswordResetToken(entity.getId(), entity.getUserId(), rawToken, entity.getExpiresAt(), entity.isUsed());
    }
}
