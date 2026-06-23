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
    void should_return_false_when_token_subject_does_not_match_expected_subject() {
        String subject = "john@mail.fr";
        String token = tokenService.generateToken(subject);

        assertThat(tokenService.isTokenValid(token, "other@mail.fr")).isFalse();
    }

    @Test
    void should_throw_jwt_exception_when_token_signature_has_been_tampered() {
        String token = tokenService.generateToken("john@mail.fr");

        // Un JWT est composé de trois segments séparés par '.'
        // On modifie un caractère au milieu du segment de signature (3e partie)
        // pour garantir que la vérification de signature échoue
        String[] parts = token.split("\\.");
        String signature = parts[2];
        // Remplacer le premier caractère par un caractère différent
        char originalChar = signature.charAt(0);
        char replacementChar = (originalChar == 'A') ? 'B' : 'A';
        String tamperedSignature = replacementChar + signature.substring(1);
        String tamperedToken = parts[0] + "." + parts[1] + "." + tamperedSignature;

        assertThatThrownBy(() -> tokenService.isTokenValid(tamperedToken, "john@mail.fr"))
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
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
