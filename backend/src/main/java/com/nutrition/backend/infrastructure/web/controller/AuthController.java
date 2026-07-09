package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.IssueRefreshTokenUseCase;
import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RefreshAccessTokenUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.application.usecase.RequestPasswordResetUseCase;
import com.nutrition.backend.application.usecase.ResetPasswordUseCase;
import com.nutrition.backend.application.usecase.RevokeRefreshTokenUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.exception.InvalidPasswordResetTokenException;
import com.nutrition.backend.domain.exception.InvalidRefreshTokenException;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.web.UserMapper;
import com.nutrition.backend.infrastructure.web.dto.AuthResponse;
import com.nutrition.backend.infrastructure.web.dto.CreateUserRequest;
import com.nutrition.backend.infrastructure.web.dto.ForgotPasswordRequest;
import com.nutrition.backend.infrastructure.web.dto.ResetPasswordRequest;
import org.springframework.beans.factory.annotation.Value;
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
    private final RequestPasswordResetUseCase requestPasswordResetUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;

    /** true en prod (HTTPS) : le cookie refresh_token n'est alors envoyé que sur des connexions sécurisées. */
    private final boolean cookieSecure;
    private final String baseUrl;

    public AuthController(RegisterUserUseCase registerUserUseCase,
                          LoginUserUseCase loginUserUseCase,
                          TokenService tokenService,
                          IssueRefreshTokenUseCase issueRefreshTokenUseCase,
                          RefreshAccessTokenUseCase refreshAccessTokenUseCase,
                          RevokeRefreshTokenUseCase revokeRefreshTokenUseCase,
                          RequestPasswordResetUseCase requestPasswordResetUseCase,
                          ResetPasswordUseCase resetPasswordUseCase,
                          @Value("${app.cookie.secure:false}") boolean cookieSecure,
                          @Value("${app.base-url:http://localhost:5173}") String baseUrl) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUserUseCase = loginUserUseCase;
        this.tokenService = tokenService;
        this.issueRefreshTokenUseCase = issueRefreshTokenUseCase;
        this.refreshAccessTokenUseCase = refreshAccessTokenUseCase;
        this.revokeRefreshTokenUseCase = revokeRefreshTokenUseCase;
        this.requestPasswordResetUseCase = requestPasswordResetUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.cookieSecure = cookieSecure;
        this.baseUrl = baseUrl;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody CreateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());
        User user = registerUserUseCase.execute(
                request.username(), request.email(), request.password(),
                request.weightGoal(), gender, request.age(),
                request.height(), request.startWeight(), request.weighInDay(),
                request.dailyStepsGoal()
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

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        requestPasswordResetUseCase.execute(request.email(), baseUrl);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            resetPasswordUseCase.execute(request.token(), request.newPassword());
            return ResponseEntity.ok().build();
        } catch (InvalidPasswordResetTokenException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private ResponseCookie buildRefreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from("refresh_token", value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/auth")
                .maxAge(maxAge)
                .sameSite("Strict")
                .build();
    }

    public record LoginRequest(String email, String password) {}
}
