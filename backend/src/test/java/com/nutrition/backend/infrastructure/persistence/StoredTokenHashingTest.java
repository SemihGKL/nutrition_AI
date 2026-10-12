package com.nutrition.backend.infrastructure.persistence;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Au démarrage, tout jeton encore stocké en clair est haché. Cas couvert : retour arrière
 * vers une version antérieure à V21 (qui stocke en clair), puis redéploiement — sans ce
 * rattrapage, ces sessions seraient perdues.
 */
class StoredTokenHashingTest {

    private static final Instant EXPIRES = Instant.parse("2026-10-20T10:00:00Z");
    private static final String CLEAR = "3f2b8c1e-7a4d-4e9b-9c2f-1a2b3c4d5e6f";
    private static final String ALREADY_HASHED = TokenHasher.sha256Hex("another-token");

    @Test
    void should_hash_refresh_tokens_still_stored_in_clear_and_leave_hashed_ones() {
        RefreshTokenJpaRepository refresh = mock(RefreshTokenJpaRepository.class);
        PasswordResetTokenJpaRepository reset = mock(PasswordResetTokenJpaRepository.class);
        when(refresh.findAll()).thenReturn(List.of(
                new RefreshTokenJpaEntity(1L, 10L, CLEAR, EXPIRES),
                new RefreshTokenJpaEntity(2L, 11L, ALREADY_HASHED, EXPIRES)));
        when(reset.findAll()).thenReturn(List.of());

        new StoredTokenHashing(refresh, reset).hashTokensStoredInClear();

        ArgumentCaptor<RefreshTokenJpaEntity> saved = ArgumentCaptor.forClass(RefreshTokenJpaEntity.class);
        verify(refresh, times(1)).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo(1L);
        assertThat(saved.getValue().getUserId()).isEqualTo(10L);
        assertThat(saved.getValue().getToken()).isEqualTo(TokenHasher.sha256Hex(CLEAR));
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(EXPIRES);
    }

    @Test
    void should_hash_reset_links_still_stored_in_clear_keeping_their_state() {
        RefreshTokenJpaRepository refresh = mock(RefreshTokenJpaRepository.class);
        PasswordResetTokenJpaRepository reset = mock(PasswordResetTokenJpaRepository.class);
        when(refresh.findAll()).thenReturn(List.of());
        when(reset.findAll()).thenReturn(List.of(new PasswordResetTokenJpaEntity(5L, 10L, CLEAR, EXPIRES, true)));

        new StoredTokenHashing(refresh, reset).hashTokensStoredInClear();

        ArgumentCaptor<PasswordResetTokenJpaEntity> saved = ArgumentCaptor.forClass(PasswordResetTokenJpaEntity.class);
        verify(reset).save(saved.capture());
        assertThat(saved.getValue().getToken()).isEqualTo(TokenHasher.sha256Hex(CLEAR));
        assertThat(saved.getValue().isUsed()).isTrue();
        assertThat(saved.getValue().getId()).isEqualTo(5L);
    }

    @Test
    void should_do_nothing_when_every_token_is_already_hashed() {
        RefreshTokenJpaRepository refresh = mock(RefreshTokenJpaRepository.class);
        PasswordResetTokenJpaRepository reset = mock(PasswordResetTokenJpaRepository.class);
        when(refresh.findAll()).thenReturn(List.of(new RefreshTokenJpaEntity(2L, 11L, ALREADY_HASHED, EXPIRES)));
        when(reset.findAll()).thenReturn(List.of());

        new StoredTokenHashing(refresh, reset).hashTokensStoredInClear();

        verify(refresh, never()).save(any());
    }
}
