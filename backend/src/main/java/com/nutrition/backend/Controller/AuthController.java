package com.nutrition.backend.Controller;

import com.nutrition.backend.Service.AuthService;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.web.dto.AuthResponse;
import com.nutrition.backend.web.dto.CreateUserRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody CreateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());
        AuthResponse response = authService.register(
                request.username(), request.email(), request.password(),
                request.weightGoal(), gender, request.age(),
                request.height(), request.startWeight(), request.weighInDay()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request.email(), request.password()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    public record LoginRequest(String email, String password) {}
}
