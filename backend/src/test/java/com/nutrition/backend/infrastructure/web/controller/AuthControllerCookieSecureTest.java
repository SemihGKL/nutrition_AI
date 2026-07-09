package com.nutrition.backend.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.application.usecase.IssueRefreshTokenUseCase;
import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RefreshAccessTokenUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.application.usecase.RequestPasswordResetUseCase;
import com.nutrition.backend.application.usecase.ResetPasswordUseCase;
import com.nutrition.backend.application.usecase.RevokeRefreshTokenUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.config.SecurityConfig;
import com.nutrition.backend.infrastructure.web.dto.CreateUserRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=900000",
        "app.cookie.secure=true"
})
class AuthControllerCookieSecureTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    TokenService tokenService;

    @MockBean
    RegisterUserUseCase registerUserUseCase;

    @MockBean
    LoginUserUseCase loginUserUseCase;

    @MockBean
    IssueRefreshTokenUseCase issueRefreshTokenUseCase;

    @MockBean
    RefreshAccessTokenUseCase refreshAccessTokenUseCase;

    @MockBean
    RevokeRefreshTokenUseCase revokeRefreshTokenUseCase;

    @MockBean
    RequestPasswordResetUseCase requestPasswordResetUseCase;

    @MockBean
    ResetPasswordUseCase resetPasswordUseCase;

    @Test
    void should_mark_refresh_cookie_secure_when_secure_flag_is_enabled() throws Exception {
        User testUser = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", null);
        when(registerUserUseCase.execute(
                anyString(), anyString(), anyString(),
                anyInt(), any(Gender.class), anyInt(),
                anyDouble(), anyDouble(), anyString(), nullable(Integer.class)
        )).thenReturn(testUser);
        when(tokenService.generateToken("test@example.com")).thenReturn("mocked-jwt-token");
        when(issueRefreshTokenUseCase.execute(1L)).thenReturn("mocked-refresh-token");

        String body = objectMapper.writeValueAsString(
                new CreateUserRequest("Test", "test@example.com", "password123",
                        "MALE", 28, 178.0, 85.0, 75, "MONDAY", null)
        );

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(cookie().secure("refresh_token", true));
    }
}
