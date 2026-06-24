package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.ports.PasswordEncoderPort;

public class FakePasswordEncoder implements PasswordEncoderPort {

    @Override
    public String encode(String rawPassword) {
        return "encoded_" + rawPassword;
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        return encodedPassword.equals("encoded_" + rawPassword);
    }
}
