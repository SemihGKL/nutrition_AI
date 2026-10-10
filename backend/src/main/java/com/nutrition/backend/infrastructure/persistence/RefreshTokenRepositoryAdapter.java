package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepository {

    private final RefreshTokenJpaRepository jpaRepository;

    public RefreshTokenRepositoryAdapter(RefreshTokenJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public RefreshToken save(RefreshToken token) {
        RefreshTokenJpaEntity entity = new RefreshTokenJpaEntity(
                token.id(), token.userId(), TokenHasher.sha256Hex(token.token()), token.expiresAt()
        );
        RefreshTokenJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved, token.token());
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return jpaRepository.findByToken(TokenHasher.sha256Hex(token)).map(e -> toDomain(e, token));
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        jpaRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void replaceUserTokens(Long userId, RefreshToken newToken) {
        jpaRepository.deleteByUserId(userId);
        jpaRepository.save(new RefreshTokenJpaEntity(
                newToken.id(), newToken.userId(), TokenHasher.sha256Hex(newToken.token()), newToken.expiresAt()
        ));
    }

    /** La base ne stocke que l'empreinte : le domaine continue de manipuler le jeton d'origine. */
    private RefreshToken toDomain(RefreshTokenJpaEntity entity, String rawToken) {
        return new RefreshToken(entity.getId(), entity.getUserId(), rawToken, entity.getExpiresAt());
    }
}
