package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.GetMealRemindersUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.UpdateMealRemindersUseCase;
import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.MealType;
import com.nutrition.backend.domain.ports.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MealReminderController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000"
})
class MealReminderControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean TokenService tokenService;
    @MockBean GetUserProfileUseCase getUserProfileUseCase;
    @MockBean GetMealRemindersUseCase getMealRemindersUseCase;
    @MockBean UpdateMealRemindersUseCase updateMealRemindersUseCase;

    private static final List<MealReminder> CONFIG = List.of(
            new MealReminder(1L, MealType.BREAKFAST, LocalTime.of(8, 0), false),
            new MealReminder(1L, MealType.LUNCH, LocalTime.of(12, 45), true),
            new MealReminder(1L, MealType.SNACK, LocalTime.of(16, 30), false),
            new MealReminder(1L, MealType.DINNER, LocalTime.of(19, 30), false));

    @BeforeEach
    void setUp() {
        when(getUserProfileUseCase.byEmail("user")).thenReturn(new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", null));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_meal_reminders_of_the_current_user() throws Exception {
        when(getMealRemindersUseCase.execute(1L)).thenReturn(CONFIG);

        mockMvc.perform(get("/api/meal-reminders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[1].meal").value("LUNCH"))
                .andExpect(jsonPath("$[1].time").value("12:45"))
                .andExpect(jsonPath("$[1].enabled").value(true));
    }

    @Test
    @WithMockUser(username = "user")
    void should_update_meal_reminders_of_the_current_user() throws Exception {
        when(updateMealRemindersUseCase.execute(eq(1L), any())).thenReturn(CONFIG);

        mockMvc.perform(put("/api/meal-reminders").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [{"meal":"LUNCH","time":"12:45","enabled":true}]
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1].time").value("12:45"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MealReminder>> captor = ArgumentCaptor.forClass(List.class);
        verify(updateMealRemindersUseCase).execute(eq(1L), captor.capture());
        assertThat(captor.getValue())
                .containsExactly(new MealReminder(1L, MealType.LUNCH, LocalTime.of(12, 45), true));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_400_when_the_time_is_invalid() throws Exception {
        mockMvc.perform(put("/api/meal-reminders").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [{"meal":"LUNCH","time":"25:99","enabled":true}]
                                """))
                .andExpect(status().isBadRequest());
        verify(updateMealRemindersUseCase, never()).execute(any(), any());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_400_when_the_meal_is_unknown() throws Exception {
        mockMvc.perform(put("/api/meal-reminders").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [{"meal":"BRUNCH","time":"11:00","enabled":true}]
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_400_when_the_time_is_missing() throws Exception {
        mockMvc.perform(put("/api/meal-reminders").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [{"meal":"LUNCH","enabled":true}]
                                """))
                .andExpect(status().isBadRequest());
        verify(updateMealRemindersUseCase, never()).execute(any(), any());
    }

    @Test
    void should_return_401_without_authentication() throws Exception {
        mockMvc.perform(get("/api/meal-reminders")).andExpect(status().isUnauthorized());
    }
}
