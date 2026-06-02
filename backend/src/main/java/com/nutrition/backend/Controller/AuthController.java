package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.model.ActivityLevel;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          JwtService jwtService,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());
        ActivityLevel activityLevel = ActivityLevel.valueOf(request.activityLevel().toUpperCase());

        User user = userService.createUser(
                request.username(),
                request.email(),
                request.weightGoal(),
                gender,
                request.age(),
                request.height(),
                activityLevel,
                request.startWeight()
        );

        String hashedPassword = passwordEncoder.encode(request.password());
        user.setPassword(hashedPassword);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.email());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of("token", token));
    }

    public record RegisterRequest(
            String username,
            String email,
            String password,
            String gender,
            int age,
            double height,
            String activityLevel,
            double startWeight,
            int weightGoal
    ) {}

    public record LoginRequest(String email, String password) {}
}
