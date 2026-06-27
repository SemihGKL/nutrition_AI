package com.nutrition.backend.domain.entity;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshTokenTest {

    @Test
    void should_not_be_expired_when_expiry_instant_is_in_the_future() {
        Instant future = Instant.now().plus(7, ChronoUnit.DAYS);
        RefreshToken token = new RefreshToken(1L, 1L, "token", future);
        assertThat(token.isExpired()).isFalse();
    }

    @Test
    void should_be_expired_when_expiry_instant_is_in_the_past() {
        Instant past = Instant.now().minus(1, ChronoUnit.DAYS);
        RefreshToken token = new RefreshToken(1L, 1L, "token", past);
        assertThat(token.isExpired()).isTrue();
    }

    @Test
    void should_be_expired_when_expiry_instant_equals_current_instant() {
        Instant now = Instant.now().minusMillis(1);
        RefreshToken token = new RefreshToken(1L, 1L, "token", now);
        assertThat(token.isExpired()).isTrue();
    }
}
