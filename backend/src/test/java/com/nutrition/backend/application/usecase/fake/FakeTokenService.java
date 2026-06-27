package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.ports.TokenService;

public class FakeTokenService implements TokenService {

    @Override
    public String generateToken(String subject) {
        return "token-for-" + subject;
    }

    @Override
    public String extractSubject(String token) {
        return token.replace("token-for-", "");
    }

    @Override
    public boolean isTokenValid(String token, String subject) {
        return token.equals("token-for-" + subject);
    }
}
