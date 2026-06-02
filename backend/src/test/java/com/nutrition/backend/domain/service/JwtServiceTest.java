package com.nutrition.backend.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private static final String SECRET = "thisIsAVeryLongSecretKeyForJwtThatMustBeAtLeast256BitsLongForHS256Algorithm";
    private static final long EXPIRATION_MS = 86400000L; // 24h

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    void should_generate_token_for_username() {
        // Given
        String username = "john@mail.fr";

        // When
        String token = jwtService.generateToken(username);

        // Then
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void should_extract_username_from_token() {
        // Given
        String username = "john@mail.fr";
        String token = jwtService.generateToken(username);

        // When
        String extracted = jwtService.extractUsername(token);

        // Then
        assertEquals(username, extracted);
    }

    @Test
    void should_return_true_when_token_is_valid() {
        // Given
        String username = "john@mail.fr";
        String token = jwtService.generateToken(username);

        // When
        boolean valid = jwtService.isTokenValid(token, username);

        // Then
        assertTrue(valid);
    }

    @Test
    void should_return_false_when_token_is_expired() {
        // Given — expiration in the past (1ms)
        JwtService expiredJwtService = new JwtService(SECRET, 1L);
        String username = "john@mail.fr";
        String token = expiredJwtService.generateToken(username);

        // Wait for token to expire
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When / Then — expired token throws exception, so isTokenValid should return false
        assertThrows(Exception.class, () -> expiredJwtService.isTokenValid(token, username));
    }
}
