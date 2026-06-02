package com.nutrition.backend.domain.ports;

public interface TokenService {
    String generateToken(String subject);
    String extractSubject(String token);
    boolean isTokenValid(String token, String subject);
}
