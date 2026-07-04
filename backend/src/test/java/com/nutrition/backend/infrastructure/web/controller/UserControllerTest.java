package com.nutrition.backend.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.UpdateUserProfileUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.web.dto.UpdateUserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000"
})
class UserControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    TokenService tokenService;

    @MockBean
    GetUserProfileUseCase getUserProfileUseCase;

    @MockBean
    UpdateUserProfileUseCase updateUserProfileUseCase;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 80.0, 1950, 75, null, null);
        when(getUserProfileUseCase.byEmail("user")).thenReturn(testUser);
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_authenticated_user_profile_when_valid_jwt_is_provided() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.username").value("Test"))
                .andExpect(jsonPath("$.gender").value("MALE"))
                .andExpect(jsonPath("$.age").value(28))
                .andExpect(jsonPath("$.dailyCalorieGoal").value(1950));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_updated_profile_when_put_request_has_all_required_fields() throws Exception {
        User updatedUser = new User(1L, "UpdatedTest", "updated@example.com", "hashed",
                Gender.MALE, 29, 178.0, 85.0, 79.0, 2000, 75, "MONDAY", null);

        // Email non modifiable via l'update : le contrôleur passe null (email conservé).
        when(updateUserProfileUseCase.execute(eq(1L), eq("UpdatedTest"), isNull(),
                eq(Gender.MALE), eq(29), eq(178.0), eq(79.0), eq("MONDAY"), eq(2000), isNull(), eq(75)))
                .thenReturn(updatedUser);

        String body = objectMapper.writeValueAsString(
                new UpdateUserRequest("UpdatedTest", "MALE", 29, 178.0, 79.0, "MONDAY", 2000, null, 75)
        );

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("UpdatedTest"))
                .andExpect(jsonPath("$.email").value("updated@example.com"))
                .andExpect(jsonPath("$.dailyCalorieGoal").value(2000));
    }

    @Test
    void should_return_401_when_put_user_me_request_has_no_jwt_token() throws Exception {
        String body = objectMapper.writeValueAsString(
                new UpdateUserRequest("Test", "MALE", 28, 178.0, 80.0, "MONDAY", null, null, null)
        );

        mockMvc.perform(put("/api/users/me")
                        .with(anonymous())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user")
    void should_skip_calorie_goal_update_when_dailyCalorieGoal_is_null_in_put_body() throws Exception {
        User updatedUser = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 78.0, 1950, 75, "WEDNESDAY", null);

        when(updateUserProfileUseCase.execute(eq(1L), eq("Test"), isNull(),
                eq(Gender.MALE), eq(28), eq(178.0), eq(78.0), eq("WEDNESDAY"), isNull(), isNull(), isNull()))
                .thenReturn(updatedUser);

        String body = objectMapper.writeValueAsString(
                new UpdateUserRequest("Test", "MALE", 28, 178.0, 78.0, "WEDNESDAY", null, null, null)
        );

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyCalorieGoal").value(1950));
    }
}
