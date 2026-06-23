package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.ports.PasswordEncoderPort;
import com.nutrition.backend.domain.ports.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class LoginUserUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoderPort passwordEncoder;

    public LoginUserUseCase(UserRepository userRepository, PasswordEncoderPort passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User execute(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email non enregistré : " + email));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mot de passe incorrect");
        }
        return user;
    }
}
