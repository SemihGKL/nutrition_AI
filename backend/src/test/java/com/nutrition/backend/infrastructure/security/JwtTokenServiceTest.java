package com.nutrition.backend.infrastructure.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenServiceTest {

    private static final String SECRET = "thisIsAVeryLongSecretKeyForJwtThatMustBeAtLeast256BitsLongForHS256Algorithm";
    private static final long EXPIRATION_MS = 86400000L;

    private JwtTokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new JwtTokenService(SECRET, EXPIRATION_MS);
    }

    @Test
    void should_generate_non_blank_token() {
        String token = tokenService.generateToken("john@mail.fr");
        assertThat(token).isNotBlank();
    }

    @Test
    void should_extract_subject_from_token() {
        String subject = "john@mail.fr";
        String token = tokenService.generateToken(subject);
        assertThat(tokenService.extractSubject(token)).isEqualTo(subject);
    }

    @Test
    void should_return_true_when_token_valid() {
        String subject = "john@mail.fr";
        String token = tokenService.generateToken(subject);
        assertThat(tokenService.isTokenValid(token, subject)).isTrue();
    }

    @Test
    void should_throw_when_token_expired() {
        JwtTokenService expiredService = new JwtTokenService(SECRET, 1L);
        String token = expiredService.generateToken("john@mail.fr");

        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertThatThrownBy(() -> expiredService.isTokenValid(token, "john@mail.fr"))
                .isInstanceOf(JwtException.class);
    }
}
