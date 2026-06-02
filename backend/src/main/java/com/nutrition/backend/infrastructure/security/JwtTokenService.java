package com.nutrition.backend.infrastructure.security;

import com.nutrition.backend.domain.ports.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public class JwtTokenService implements TokenService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtTokenService(String secret, long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    @Override
    public String generateToken(String subject) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    @Override
    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    @Override
    public boolean isTokenValid(String token, String subject) {
        String extracted = extractSubject(token);
        return extracted.equals(subject) && !isExpired(token);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }
}
