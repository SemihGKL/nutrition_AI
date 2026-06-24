package com.nutrition.backend.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.config.SecurityConfig;
import com.nutrition.backend.infrastructure.web.dto.CreateUserRequest;
import org.junit.jupiter.api.BeforeEach;
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
        "jwt.expiration=86400000"
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
                anyDouble(), anyDouble(), anyString()
        )).thenReturn(testUser);
        when(tokenService.generateToken("test@example.com")).thenReturn("mocked-jwt-token");

        String body = objectMapper.writeValueAsString(
                new CreateUserRequest("Test", "test@example.com", "password123",
                        "MALE", 28, 178.0, 85.0, 75, "MONDAY")
        );

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.username").value("Test"));
    }

    @Test
    void should_return_200_with_token_when_login_is_successful() throws Exception {
        when(loginUserUseCase.execute("test@example.com", "password123")).thenReturn(testUser);
        when(tokenService.generateToken("test@example.com")).thenReturn("mocked-jwt-token");

        String body = objectMapper.writeValueAsString(
                new AuthController.LoginRequest("test@example.com", "password123")
        );

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
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
}
