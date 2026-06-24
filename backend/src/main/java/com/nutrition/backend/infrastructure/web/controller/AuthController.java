package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.IssueRefreshTokenUseCase;
import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RefreshAccessTokenUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.application.usecase.RevokeRefreshTokenUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.InvalidRefreshTokenException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.web.UserMapper;
import com.nutrition.backend.infrastructure.web.dto.AuthResponse;
import com.nutrition.backend.infrastructure.web.dto.CreateUserRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUserUseCase loginUserUseCase;
    private final TokenService tokenService;
    private final IssueRefreshTokenUseCase issueRefreshTokenUseCase;
    private final RefreshAccessTokenUseCase refreshAccessTokenUseCase;
    private final RevokeRefreshTokenUseCase revokeRefreshTokenUseCase;

    public AuthController(RegisterUserUseCase registerUserUseCase,
                          LoginUserUseCase loginUserUseCase,
                          TokenService tokenService,
                          IssueRefreshTokenUseCase issueRefreshTokenUseCase,
                          RefreshAccessTokenUseCase refreshAccessTokenUseCase,
                          RevokeRefreshTokenUseCase revokeRefreshTokenUseCase) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUserUseCase = loginUserUseCase;
        this.tokenService = tokenService;
        this.issueRefreshTokenUseCase = issueRefreshTokenUseCase;
        this.refreshAccessTokenUseCase = refreshAccessTokenUseCase;
        this.revokeRefreshTokenUseCase = revokeRefreshTokenUseCase;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody CreateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());
        User user = registerUserUseCase.execute(
                request.username(), request.email(), request.password(),
                request.weightGoal(), gender, request.age(),
                request.height(), request.startWeight(), request.weighInDay()
        );
        String accessToken = tokenService.generateToken(user.getEmail());
        String rawRefreshToken = issueRefreshTokenUseCase.execute(user.getId());
        ResponseCookie cookie = buildRefreshCookie(rawRefreshToken, Duration.ofDays(7));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(accessToken, UserMapper.toDto(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = loginUserUseCase.execute(request.email(), request.password());
            String accessToken = tokenService.generateToken(user.getEmail());
            String rawRefreshToken = issueRefreshTokenUseCase.execute(user.getId());
            ResponseCookie cookie = buildRefreshCookie(rawRefreshToken, Duration.ofDays(7));
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(new AuthResponse(accessToken, UserMapper.toDto(user)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            @CookieValue(name = "refresh_token", required = false) String rawRefreshToken) {
        if (rawRefreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            RefreshAccessTokenUseCase.Result result = refreshAccessTokenUseCase.execute(rawRefreshToken);
            ResponseCookie cookie = buildRefreshCookie(result.refreshToken(), Duration.ofDays(7));
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of("accessToken", result.accessToken()));
        } catch (InvalidRefreshTokenException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refresh_token", required = false) String rawRefreshToken) {
        if (rawRefreshToken != null) {
            revokeRefreshTokenUseCase.execute(rawRefreshToken);
        }
        ResponseCookie clearCookie = buildRefreshCookie("", Duration.ZERO);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    private ResponseCookie buildRefreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from("refresh_token", value)
                .httpOnly(true)
                .path("/api/auth")
                .maxAge(maxAge)
                .sameSite("Strict")
                .build();
    }

    public record LoginRequest(String email, String password) {}
}
