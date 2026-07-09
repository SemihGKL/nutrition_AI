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
import com.nutrition.backend.domain.exception.EmailAlreadyUsedException;
import com.nutrition.backend.domain.exception.InvalidRefreshTokenException;
import com.nutrition.backend.domain.model.Gender;
import org.springframework.dao.DataIntegrityViolationException;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.config.SecurityConfig;
import com.nutrition.backend.infrastructure.web.dto.CreateUserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=900000"
})
class AuthControllerTest {

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

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", null);
    }

    @Test
    void should_return_200_with_token_and_user_when_register_is_successful() throws Exception {
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
                .andExpect(jsonPath("$.token").value("mocked-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.username").value("Test"));
    }

    @Test
    void should_forward_daily_steps_goal_from_request_to_use_case_and_expose_it_in_response() throws Exception {
        User userWithStepsGoal = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", 8000);
        when(registerUserUseCase.execute(
                anyString(), anyString(), anyString(),
                anyInt(), any(Gender.class), anyInt(),
                anyDouble(), anyDouble(), anyString(), nullable(Integer.class)
        )).thenReturn(userWithStepsGoal);
        when(tokenService.generateToken("test@example.com")).thenReturn("mocked-jwt-token");
        when(issueRefreshTokenUseCase.execute(1L)).thenReturn("mocked-refresh-token");

        String body = objectMapper.writeValueAsString(
                new CreateUserRequest("Test", "test@example.com", "password123",
                        "MALE", 28, 178.0, 85.0, 75, "MONDAY", 8000)
        );

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.dailyStepsGoal").value(8000));

        // Le contrôleur transmet bien l'objectif de pas reçu au use case.
        ArgumentCaptor<Integer> stepsGoalCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(registerUserUseCase).execute(
                anyString(), anyString(), anyString(),
                anyInt(), any(Gender.class), anyInt(),
                anyDouble(), anyDouble(), anyString(), stepsGoalCaptor.capture());
        assertThat(stepsGoalCaptor.getValue()).isEqualTo(8000);
    }

    @Test
    void should_return_409_when_registering_with_an_already_used_email() throws Exception {
        when(registerUserUseCase.execute(
                anyString(), anyString(), anyString(),
                anyInt(), any(Gender.class), anyInt(),
                anyDouble(), anyDouble(), anyString(), nullable(Integer.class)
        )).thenThrow(new EmailAlreadyUsedException());

        String body = objectMapper.writeValueAsString(
                new CreateUserRequest("Test", "dup@example.com", "password123",
                        "MALE", 28, 178.0, 85.0, 75, "MONDAY", null)
        );

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void should_return_409_when_a_data_integrity_violation_occurs() throws Exception {
        // Course : deux inscriptions concurrentes passent le pré-check puis heurtent la contrainte DB.
        when(registerUserUseCase.execute(
                anyString(), anyString(), anyString(),
                anyInt(), any(Gender.class), anyInt(),
                anyDouble(), anyDouble(), anyString(), nullable(Integer.class)
        )).thenThrow(new DataIntegrityViolationException("uq_users_email"));

        String body = objectMapper.writeValueAsString(
                new CreateUserRequest("Test", "race@example.com", "password123",
                        "MALE", 28, 178.0, 85.0, 75, "MONDAY", null)
        );

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void should_return_400_when_registering_with_a_malformed_email() throws Exception {
        String body = objectMapper.writeValueAsString(
                new CreateUserRequest("Test", "not-an-email", "password123",
                        "MALE", 28, 178.0, 85.0, 75, "MONDAY", null)
        );

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_200_with_token_when_login_is_successful() throws Exception {
        when(loginUserUseCase.execute("test@example.com", "password123")).thenReturn(testUser);
        when(tokenService.generateToken("test@example.com")).thenReturn("mocked-jwt-token");
        when(issueRefreshTokenUseCase.execute(1L)).thenReturn("mocked-refresh-token");

        String body = objectMapper.writeValueAsString(
                new AuthController.LoginRequest("test@example.com", "password123")
        );

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(jsonPath("$.token").value("mocked-jwt-token"));
    }

    @Test
    void should_return_401_when_login_credentials_are_invalid() throws Exception {
        when(loginUserUseCase.execute(anyString(), anyString()))
                .thenThrow(new IllegalArgumentException("Mot de passe incorrect"));

        String body = objectMapper.writeValueAsString(
                new AuthController.LoginRequest("test@example.com", "wrong-password")
        );

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_with_new_access_token_when_refresh_cookie_is_valid() throws Exception {
        when(refreshAccessTokenUseCase.execute("valid-refresh-token"))
                .thenReturn(new RefreshAccessTokenUseCase.Result("new-access-token", "new-refresh-token"));

        mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf())
                        .cookie(new Cookie("refresh_token", "valid-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(jsonPath("$.accessToken").value("new-access-token"));
    }

    @Test
    void should_return_401_when_refresh_cookie_is_missing() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_401_when_refresh_token_is_invalid() throws Exception {
        when(refreshAccessTokenUseCase.execute("bad-token"))
                .thenThrow(new InvalidRefreshTokenException());

        mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf())
                        .cookie(new Cookie("refresh_token", "bad-token")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_204_and_clear_cookie_on_logout() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .cookie(new Cookie("refresh_token", "some-token")))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refresh_token", 0));
    }
}
