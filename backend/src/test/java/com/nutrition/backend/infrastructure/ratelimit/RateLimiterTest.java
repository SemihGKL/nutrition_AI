package com.nutrition.backend.infrastructure.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterTest {

    @Test
    void should_allow_requests_up_to_capacity() {
        RateLimiter limiter = new RateLimiter(3, Duration.ofMinutes(1));

        assertThat(limiter.tryConsume("client")).isTrue();
        assertThat(limiter.tryConsume("client")).isTrue();
        assertThat(limiter.tryConsume("client")).isTrue();
    }

    @Test
    void should_block_a_request_that_exceeds_capacity() {
        RateLimiter limiter = new RateLimiter(2, Duration.ofMinutes(1));
        limiter.tryConsume("client");
        limiter.tryConsume("client");

        assertThat(limiter.tryConsume("client")).isFalse();
    }

    @Test
    void should_track_each_key_independently() {
        RateLimiter limiter = new RateLimiter(1, Duration.ofMinutes(1));

        assertThat(limiter.tryConsume("client-a")).isTrue();
        assertThat(limiter.tryConsume("client-b")).isTrue();
        assertThat(limiter.tryConsume("client-a")).isFalse();
    }

    // ── Mémoire bornée : une clé inactive depuis une période complète est oubliée ──
    // (son seau serait de toute façon plein à nouveau : l'oublier ne change rien).

    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-10T10:00:00Z");
        void advance(Duration d) { now = now.plus(d); }
        @Override public Instant instant() { return now; }
        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
    }

    @Test
    void should_forget_keys_idle_for_a_full_refill_period() {
        MutableClock clock = new MutableClock();
        RateLimiter limiter = new RateLimiter(5, Duration.ofMinutes(1), clock);
        for (int i = 0; i < 100; i++) limiter.tryConsume("ip:" + i);
        assertThat(limiter.trackedKeys()).isEqualTo(100);

        clock.advance(Duration.ofSeconds(61));
        limiter.tryConsume("ip:new");

        assertThat(limiter.trackedKeys()).isEqualTo(1);
    }

    @Test
    void should_keep_limiting_a_key_that_is_still_active() {
        MutableClock clock = new MutableClock();
        RateLimiter limiter = new RateLimiter(1, Duration.ofMinutes(1), clock);
        limiter.tryConsume("ip:attacker");
        clock.advance(Duration.ofSeconds(40));
        limiter.tryConsume("ip:attacker");          // toujours actif
        clock.advance(Duration.ofSeconds(30));

        limiter.tryConsume("ip:other");             // déclenche le ménage

        assertThat(limiter.trackedKeys()).isEqualTo(2);
        assertThat(limiter.tryConsume("ip:attacker")).isFalse();
    }
}
