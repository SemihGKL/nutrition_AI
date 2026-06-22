package com.nutrition.backend.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.DailyRecapService;
import com.nutrition.backend.Service.ObjectiveService;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.Config.JwtAuthenticationFilter;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DailyCaloriesController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000"
})
class DailyCaloriesControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    TokenService tokenService;

    @MockBean
    UserService userService;

    @MockBean
    DailyCaloriesService dailyCaloriesService;

    @MockBean
    DailyRecapService dailyRecapService;

    @MockBean
    ObjectiveService objectiveService;

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
    void should_return_all_daily_entries_when_valid_jwt_is_provided() throws Exception {
        DailyCalories entry1 = new DailyCalories();
        entry1.setId(1L);
        entry1.setDate(LocalDate.of(2026, 6, 9));
        entry1.setCaloriesConsumed(1800);

        DailyCalories entry2 = new DailyCalories();
        entry2.setId(2L);
        entry2.setDate(LocalDate.of(2026, 6, 10));
        entry2.setCaloriesConsumed(2100);

        when(dailyCaloriesService.getAllDailyCalories(1L)).thenReturn(List.of(entry1, entry2));

        mockMvc.perform(get("/api/daily-kcal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].caloriesConsumed").value(1800))
                .andExpect(jsonPath("$[1].caloriesConsumed").value(2100));
    }

    @Test
    void should_return_401_when_no_jwt_is_provided() throws Exception {
        mockMvc.perform(get("/api/daily-kcal"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_daily_entry_for_valid_date_when_entry_exists() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 10);

        DailyCalories entry = new DailyCalories();
        entry.setId(1L);
        entry.setDate(date);
        entry.setCaloriesConsumed(1900);
        entry.setSteps(7500);
        entry.setCaloriesBurned(200);

        when(dailyCaloriesService.getDailyCalories(1L, date)).thenReturn(Optional.of(entry));

        mockMvc.perform(get("/api/daily-kcal/2026-06-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caloriesConsumed").value(1900))
                .andExpect(jsonPath("$.steps").value(7500))
                .andExpect(jsonPath("$.caloriesBurned").value(200));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_404_when_no_entry_exists_for_given_date() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 10);

        when(dailyCaloriesService.getDailyCalories(1L, date)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/daily-kcal/2026-06-10"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_400_when_date_segment_cannot_be_parsed() throws Exception {
        mockMvc.perform(get("/api/daily-kcal/19"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user")
    void should_save_new_daily_entry_when_post_body_is_valid_and_has_no_userId() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 10);

        DailyCalories saved = new DailyCalories();
        saved.setId(10L);
        saved.setDate(date);
        saved.setCaloriesConsumed(1850);
        saved.setSteps(8000);
        saved.setCaloriesBurned(180);
        saved.setConfirmed(false);

        when(dailyCaloriesService.saveDailyCalories(any(DailyCalories.class))).thenReturn(saved);

        String body = objectMapper.writeValueAsString(
                new CreateDailyCaloriesRequest(null, date, 1850, 8000, 180, false)
        );

        mockMvc.perform(post("/api/daily-kcal")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.caloriesConsumed").value(1850))
                .andExpect(jsonPath("$.steps").value(8000));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_updated_entry_when_posting_for_date_that_already_has_entry() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 10);

        DailyCalories updated = new DailyCalories();
        updated.setId(10L);
        updated.setDate(date);
        updated.setCaloriesConsumed(2200);
        updated.setSteps(10000);
        updated.setCaloriesBurned(300);
        updated.setConfirmed(true);

        when(dailyCaloriesService.saveDailyCalories(any(DailyCalories.class))).thenReturn(updated);

        String body = objectMapper.writeValueAsString(
                new CreateDailyCaloriesRequest(10L, date, 2200, 10000, 300, true)
        );

        mockMvc.perform(post("/api/daily-kcal")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caloriesConsumed").value(2200))
                .andExpect(jsonPath("$.confirmed").value(true));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_daily_recap_when_valid_date_is_provided() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 10);

        // stepsKcal = round(max(0,7500-4000) × (70/70) × 0.025) = round(3500 × 0.025) = 88
        DailyRecapResponse recap = new DailyRecapResponse(
                date, 1900, 200, 7500, 88, 1550, 1950, 1800.0, 2160.0, 610.0, 28.2, false
        );

        when(dailyRecapService.getRecap(1L, date)).thenReturn(recap);

        mockMvc.perform(get("/api/daily-kcal/2026-06-10/recap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caloriesConsumed").value(1900))
                .andExpect(jsonPath("$.netCalories").value(1550))
                .andExpect(jsonPath("$.dailyCalorieGoal").value(1950));
    }
}
