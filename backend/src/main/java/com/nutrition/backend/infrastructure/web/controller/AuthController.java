package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.web.UserMapper;
import com.nutrition.backend.infrastructure.web.dto.AuthResponse;
import com.nutrition.backend.infrastructure.web.dto.CreateUserRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUserUseCase loginUserUseCase;
    private final TokenService tokenService;

    public AuthController(RegisterUserUseCase registerUserUseCase,
                          LoginUserUseCase loginUserUseCase,
                          TokenService tokenService) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUserUseCase = loginUserUseCase;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody CreateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());
        User user = registerUserUseCase.execute(
                request.username(), request.email(), request.password(),
                request.weightGoal(), gender, request.age(),
                request.height(), request.startWeight(), request.weighInDay()
        );
        String token = tokenService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserMapper.toDto(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = loginUserUseCase.execute(request.email(), request.password());
            String token = tokenService.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(token, UserMapper.toDto(user)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    public record LoginRequest(String email, String password) {}
}
