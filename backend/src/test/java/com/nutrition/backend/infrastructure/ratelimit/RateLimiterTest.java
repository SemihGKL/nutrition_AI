package com.nutrition.backend.infrastructure.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;

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
}
