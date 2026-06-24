package com.nutrition.backend.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.domain.exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.application.usecase.GetDailyEntryUseCase;
import com.nutrition.backend.application.usecase.GetDailyRecapUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.RecordDailyEntryUseCase;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.application.usecase.DailyRecapResult;
import com.nutrition.backend.infrastructure.web.dto.CreateDailyCaloriesRequest;
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
    GetUserProfileUseCase getUserProfileUseCase;

    @MockBean
    GetDailyEntryUseCase getDailyEntryUseCase;

    @MockBean
    RecordDailyEntryUseCase recordDailyEntryUseCase;

    @MockBean
    GetDailyRecapUseCase getDailyRecapUseCase;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 80.0, 1950, 75, null, null);

        when(getUserProfileUseCase.byEmail("user")).thenReturn(testUser);
    }

    private DailyEntry entry(Long id, LocalDate date, int kcal, int steps, int burned, boolean confirmed) {
        return new DailyEntry(id, 1L, date, kcal, steps, burned, confirmed);
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_all_daily_entries_when_valid_jwt_is_provided() throws Exception {
        DailyEntry entry1 = entry(1L, LocalDate.of(2026, 6, 9), 1800, 0, 0, false);
        DailyEntry entry2 = entry(2L, LocalDate.of(2026, 6, 10), 2100, 0, 0, false);

        when(getDailyEntryUseCase.allByUser(1L)).thenReturn(List.of(entry1, entry2));

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
        DailyEntry entry = entry(1L, date, 1900, 7500, 200, false);

        when(getDailyEntryUseCase.byUserAndDate(1L, date)).thenReturn(Optional.of(entry));

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

        when(getDailyEntryUseCase.byUserAndDate(1L, date)).thenReturn(Optional.empty());

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
        DailyEntry saved = entry(10L, date, 1850, 8000, 180, false);

        when(recordDailyEntryUseCase.execute(any(DailyEntry.class))).thenReturn(saved);

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
        DailyEntry updated = entry(10L, date, 2200, 10000, 300, true);

        when(recordDailyEntryUseCase.execute(any(DailyEntry.class))).thenReturn(updated);

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
    void should_return_404_when_recap_is_requested_for_a_date_with_no_daily_entry() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 11);

        when(getDailyRecapUseCase.execute(1L, date))
                .thenThrow(new DailyCaloriesNotFoundException("No daily calories entry found for userId=1 on " + date));

        mockMvc.perform(get("/api/daily-kcal/2026-06-11/recap"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_400_when_post_daily_kcal_body_is_missing_required_fields() throws Exception {
        mockMvc.perform(post("/api/daily-kcal")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_daily_recap_when_valid_date_is_provided() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 10);

        DailyRecapResult recap = new DailyRecapResult(
                date, 1900, 200, 7500, 88, 1550, 1950, 1800.0, 2160.0, 610.0, 28.2, false
        );

        when(getDailyRecapUseCase.execute(1L, date)).thenReturn(recap);

        mockMvc.perform(get("/api/daily-kcal/2026-06-10/recap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caloriesConsumed").value(1900))
                .andExpect(jsonPath("$.netCalories").value(1550))
                .andExpect(jsonPath("$.dailyCalorieGoal").value(1950));
    }
}
