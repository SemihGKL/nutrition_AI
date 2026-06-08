package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.AuthResponse;
import com.nutrition.backend.web.dto.CreateUserRequest;
import com.nutrition.backend.web.dto.UserDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final TokenService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          TokenService jwtService,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody CreateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());

        User user = userService.createUser(
                request.username(),
                request.email(),
                request.weightGoal(),
                gender,
                request.age(),
                request.height(),
                request.startWeight(),
                request.weighInDay()
        );

        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, toDto(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.email());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, toDto(user)));
    }

    private UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDailyCalorieGoal(),
                user.getWeightGoal(),
                user.getGender(),
                user.getAge(),
                user.getHeight(),
                user.getStartWeight(),
                user.getCurrentWeight(),
                user.getWeighInDay()
        );
    }

    public record LoginRequest(String email, String password) {}
}
