package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

public class FakePasswordResetTokenRepository implements PasswordResetTokenRepository {

    private final Map<String, PasswordResetToken> store = new HashMap<>();
    private final java.util.Set<String> usedRightAfterRead = new java.util.HashSet<>();

    /**
     * Simule une requête concurrente : la prochaine lecture renvoie le jeton encore
     * valide, mais une autre requête l'utilise aussitôt après.
     */
    public void simulateConcurrentUseAfterRead(String token) {
        usedRightAfterRead.add(token);
    }
    private final AtomicLong idSequence = new AtomicLong(1);

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        Long id = token.id() != null ? token.id() : idSequence.getAndIncrement();
        PasswordResetToken stored = new PasswordResetToken(id, token.userId(), token.token(), token.expiresAt(), token.used());
        store.put(stored.token(), stored);
        return stored;
    }

    @Override
    public Optional<PasswordResetToken> findByToken(String token) {
        Optional<PasswordResetToken> read = Optional.ofNullable(store.get(token));
        if (usedRightAfterRead.remove(token)) {
            read.ifPresent(t -> store.put(token, new PasswordResetToken(t.id(), t.userId(), t.token(), t.expiresAt(), true)));
        }
        return read;
    }

    @Override
    public boolean claim(String token) {
        PasswordResetToken t = store.get(token);
        if (t == null || !t.isValid()) return false;
        store.put(token, new PasswordResetToken(t.id(), t.userId(), t.token(), t.expiresAt(), true));
        return true;
    }

    @Override
    public void deleteByUserId(Long userId) {
        store.values().removeIf(t -> t.userId().equals(userId));
    }

    public List<PasswordResetToken> getAll() {
        return new ArrayList<>(store.values());
    }
}
