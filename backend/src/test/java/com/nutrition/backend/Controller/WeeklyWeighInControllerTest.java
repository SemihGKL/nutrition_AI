package com.nutrition.backend.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.Service.WeeklyWeighInService;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.CreateWeighInRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WeeklyWeighInController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000"
})
class WeeklyWeighInControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    TokenService tokenService;

    @MockBean
    UserService userService;

    @MockBean
    WeeklyWeighInService weeklyWeighInService;

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
    void should_return_all_weighins_when_valid_jwt_is_provided() throws Exception {
        WeeklyWeighIn w1 = new WeeklyWeighIn();
        w1.setId(1L);
        w1.setDate(LocalDate.of(2026, 6, 9));
        w1.setWeight(80.5);

        WeeklyWeighIn w2 = new WeeklyWeighIn();
        w2.setId(2L);
        w2.setDate(LocalDate.of(2026, 6, 2));
        w2.setWeight(81.0);

        when(weeklyWeighInService.getAllByUser(1L)).thenReturn(List.of(w1, w2));

        mockMvc.perform(get("/api/weighin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].weight").value(80.5))
                .andExpect(jsonPath("$[1].weight").value(81.0));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_latest_weighin_when_at_least_one_exists() throws Exception {
        WeeklyWeighIn latest = new WeeklyWeighIn();
        latest.setId(1L);
        latest.setDate(LocalDate.of(2026, 6, 9));
        latest.setWeight(80.5);
        latest.setNote("Feeling good");

        when(weeklyWeighInService.getLatestByUser(1L)).thenReturn(Optional.of(latest));

        mockMvc.perform(get("/api/weighin/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weight").value(80.5))
                .andExpect(jsonPath("$.note").value("Feeling good"));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_204_when_no_weighin_has_been_recorded() throws Exception {
        when(weeklyWeighInService.getLatestByUser(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/weighin/latest"))
                .andExpect(status().isNoContent());
    }

    @Test
    void should_return_401_when_post_weighin_request_has_no_jwt_token() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 11);
        String body = objectMapper.writeValueAsString(
                new CreateWeighInRequest(date, 79.8, "Morning weigh-in")
        );

        mockMvc.perform(post("/api/weighin")
                        .with(anonymous())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_400_when_post_weighin_body_is_missing_date_or_weight() throws Exception {
        mockMvc.perform(post("/api/weighin")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user")
    void should_save_new_weighin_when_post_body_is_valid_and_has_no_userId() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 11);

        WeeklyWeighIn saved = new WeeklyWeighIn();
        saved.setId(5L);
        saved.setDate(date);
        saved.setWeight(79.8);
        saved.setNote("Morning weigh-in");

        when(weeklyWeighInService.saveWeighIn(any(WeeklyWeighIn.class))).thenReturn(saved);

        String body = objectMapper.writeValueAsString(
                new CreateWeighInRequest(date, 79.8, "Morning weigh-in")
        );

        mockMvc.perform(post("/api/weighin")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.weight").value(79.8))
                .andExpect(jsonPath("$.note").value("Morning weigh-in"));
    }
}
