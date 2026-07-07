package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
                token.id(), token.userId(), token.token(), token.expiresAt(), token.used()
        );
        PasswordResetTokenJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<PasswordResetToken> findByToken(String token) {
        return jpaRepository.findByToken(token).map(this::toDomain);
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        jpaRepository.deleteByUserId(userId);
    }

    private PasswordResetToken toDomain(PasswordResetTokenJpaEntity entity) {
        return new PasswordResetToken(entity.getId(), entity.getUserId(), entity.getToken(), entity.getExpiresAt(), entity.isUsed());
    }
}
