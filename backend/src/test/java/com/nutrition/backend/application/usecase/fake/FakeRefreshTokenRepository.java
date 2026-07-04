package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class FakeRefreshTokenRepository implements RefreshTokenRepository {

    private final Map<String, RefreshToken> store = new HashMap<>();

    @Override
    public RefreshToken save(RefreshToken token) {
        store.put(token.token(), token);
        return token;
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return Optional.ofNullable(store.get(token));
    }

    @Override
    public void deleteByUserId(Long userId) {
        store.values().removeIf(t -> t.userId().equals(userId));
    }

    @Override
    public void replaceUserTokens(Long userId, RefreshToken newToken) {
        store.values().removeIf(t -> t.userId().equals(userId));
        store.put(newToken.token(), newToken);
    }

    public long countByUserId(Long userId) {
        return store.values().stream().filter(t -> t.userId().equals(userId)).count();
    }
}
