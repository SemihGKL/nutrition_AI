package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.UserMapper;
import com.nutrition.backend.web.dto.AuthResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       TokenService tokenService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public AuthResponse register(String username, String email, String rawPassword,
                                  int weightGoal, Gender gender, int age,
                                  Double height, double startWeight, String weighInDay) {
        User user = userService.createUser(username, email, weightGoal, gender, age, height, startWeight, weighInDay);
        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
        String token = tokenService.generateToken(user.getEmail());
        return new AuthResponse(token, UserMapper.toDto(user));
    }

    public AuthResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email non enregistré : " + email));
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Mot de passe incorrect");
        }
        String token = tokenService.generateToken(user.getEmail());
        return new AuthResponse(token, UserMapper.toDto(user));
    }
}
