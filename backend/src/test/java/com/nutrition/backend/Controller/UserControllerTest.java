package com.nutrition.backend.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.UpdateUserRequest;
import com.nutrition.backend.web.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
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
    UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("Test");
        testUser.setGender("MALE");
        testUser.setAge(28);
        testUser.setHeight(178.0);
        testUser.setCurrentWeight(80.0);
        testUser.setStartWeight(85.0);
        testUser.setWeightGoal(75);
        testUser.setDailyCalorieGoal(1950);
        when(userService.getByEmail("user")).thenReturn(testUser);
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
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setEmail("updated@example.com");
        updatedUser.setUsername("UpdatedTest");
        updatedUser.setGender("MALE");
        updatedUser.setAge(29);
        updatedUser.setHeight(178.0);
        updatedUser.setCurrentWeight(79.0);
        updatedUser.setStartWeight(85.0);
        updatedUser.setWeightGoal(75);
        updatedUser.setDailyCalorieGoal(2000);
        updatedUser.setWeighInDay("MONDAY");

        when(userService.updateBodyMetrics(eq(1L), any(), eq(29), eq(178.0), eq(79.0), eq("MONDAY")))
                .thenReturn(updatedUser);
        when(userService.updateProfile(eq(1L), any(), any())).thenReturn(updatedUser);
        when(userService.updateCalorieGoal(eq(1L), eq(2000))).thenReturn(updatedUser);
        when(userService.getUserById(1L)).thenReturn(updatedUser);

        String body = objectMapper.writeValueAsString(
                new UpdateUserRequest("UpdatedTest", "updated@example.com", "MALE", 29, 178.0, 79.0, "MONDAY", 2000)
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
    @WithMockUser(username = "user")
    void should_skip_calorie_goal_update_when_dailyCalorieGoal_is_null_in_put_body() throws Exception {
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setEmail("test@example.com");
        updatedUser.setUsername("Test");
        updatedUser.setGender("MALE");
        updatedUser.setAge(28);
        updatedUser.setHeight(178.0);
        updatedUser.setCurrentWeight(78.0);
        updatedUser.setStartWeight(85.0);
        updatedUser.setWeightGoal(75);
        updatedUser.setDailyCalorieGoal(1950);
        updatedUser.setWeighInDay("WEDNESDAY");

        when(userService.updateBodyMetrics(eq(1L), any(), eq(28), eq(178.0), eq(78.0), eq("WEDNESDAY")))
                .thenReturn(updatedUser);
        when(userService.updateProfile(eq(1L), any(), any())).thenReturn(updatedUser);
        when(userService.getUserById(1L)).thenReturn(updatedUser);

        String body = objectMapper.writeValueAsString(
                new UpdateUserRequest("Test", "test@example.com", "MALE", 28, 178.0, 78.0, "WEDNESDAY", null)
        );

        mockMvc.perform(put("/api/users/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyCalorieGoal").value(1950));
    }
}
