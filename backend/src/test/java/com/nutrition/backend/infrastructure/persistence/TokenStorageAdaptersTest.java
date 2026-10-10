package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.PasswordResetToken;
import com.nutrition.backend.domain.entity.RefreshToken;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Les jetons ne sont jamais stockés en clair : seule leur empreinte SHA-256 va en base. */
class TokenStorageAdaptersTest {

    private static final String RAW = "raw-token-123";
    private static final String HASH = TokenHasher.sha256Hex(RAW);
    private static final Instant EXPIRES = Instant.parse("2026-10-17T10:00:00Z");

    // ── Refresh tokens ──────────────────────────────────────────────────────

    @Test
    void should_store_only_the_hash_of_a_refresh_token() {
        RefreshTokenJpaRepository jpa = mock(RefreshTokenJpaRepository.class);
        when(jpa.save(any())).thenAnswer(i -> i.getArgument(0));
        RefreshTokenRepositoryAdapter adapter = new RefreshTokenRepositoryAdapter(jpa);

        RefreshToken saved = adapter.save(new RefreshToken(null, 1L, RAW, EXPIRES));

        ArgumentCaptor<RefreshTokenJpaEntity> stored = ArgumentCaptor.forClass(RefreshTokenJpaEntity.class);
        verify(jpa).save(stored.capture());
        assertThat(stored.getValue().getToken()).isEqualTo(HASH);
        assertThat(saved.token()).isEqualTo(RAW);
    }

    @Test
    void should_find_a_refresh_token_by_its_hash() {
        RefreshTokenJpaRepository jpa = mock(RefreshTokenJpaRepository.class);
        when(jpa.findByToken(HASH)).thenReturn(Optional.of(new RefreshTokenJpaEntity(7L, 1L, HASH, EXPIRES)));
        RefreshTokenRepositoryAdapter adapter = new RefreshTokenRepositoryAdapter(jpa);

        Optional<RefreshToken> found = adapter.findByToken(RAW);

        assertThat(found).hasValueSatisfying(t -> {
            assertThat(t.id()).isEqualTo(7L);
            assertThat(t.token()).isEqualTo(RAW);
        });
    }

    @Test
    void should_store_only_the_hash_when_rotating_refresh_tokens() {
        RefreshTokenJpaRepository jpa = mock(RefreshTokenJpaRepository.class);
        RefreshTokenRepositoryAdapter adapter = new RefreshTokenRepositoryAdapter(jpa);

        adapter.replaceUserTokens(1L, new RefreshToken(null, 1L, RAW, EXPIRES));

        ArgumentCaptor<RefreshTokenJpaEntity> stored = ArgumentCaptor.forClass(RefreshTokenJpaEntity.class);
        verify(jpa).save(stored.capture());
        assertThat(stored.getValue().getToken()).isEqualTo(HASH);
    }

    // ── Liens de réinitialisation ───────────────────────────────────────────

    @Test
    void should_store_only_the_hash_of_a_reset_link() {
        PasswordResetTokenJpaRepository jpa = mock(PasswordResetTokenJpaRepository.class);
        when(jpa.save(any())).thenAnswer(i -> i.getArgument(0));
        PasswordResetTokenRepositoryAdapter adapter = new PasswordResetTokenRepositoryAdapter(jpa);

        PasswordResetToken saved = adapter.save(new PasswordResetToken(null, 1L, RAW, EXPIRES, false));

        ArgumentCaptor<PasswordResetTokenJpaEntity> stored = ArgumentCaptor.forClass(PasswordResetTokenJpaEntity.class);
        verify(jpa).save(stored.capture());
        assertThat(stored.getValue().getToken()).isEqualTo(HASH);
        assertThat(saved.token()).isEqualTo(RAW);
    }

    @Test
    void should_find_and_claim_a_reset_link_by_its_hash() {
        PasswordResetTokenJpaRepository jpa = mock(PasswordResetTokenJpaRepository.class);
        when(jpa.findByToken(HASH)).thenReturn(Optional.of(new PasswordResetTokenJpaEntity(3L, 1L, HASH, EXPIRES, false)));
        when(jpa.claim(eq(HASH), any())).thenReturn(1);
        PasswordResetTokenRepositoryAdapter adapter = new PasswordResetTokenRepositoryAdapter(jpa);

        assertThat(adapter.findByToken(RAW)).hasValueSatisfying(t -> assertThat(t.token()).isEqualTo(RAW));
        assertThat(adapter.claim(RAW)).isTrue();
    }
}
