package com.nutrition.backend.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import com.nutrition.backend.application.service.ObjectiveService;
import com.nutrition.backend.application.usecase.GetDailyEntryUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.web.dto.CreateObjectiveRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ObjectiveController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000"
})
class ObjectiveControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    TokenService tokenService;

    @MockBean
    GetUserProfileUseCase getUserProfileUseCase;

    @MockBean
    ObjectiveService objectiveService;

    @MockBean
    GetDailyEntryUseCase getDailyEntryUseCase;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 80.0, 1950, 75, null, null);
        when(getUserProfileUseCase.byEmail("user")).thenReturn(testUser);
    }

    @Test
    void should_return_401_when_request_has_no_jwt_token() throws Exception {
        mockMvc.perform(get("/api/objectives"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_empty_list_when_authenticated_user_has_no_objectives() throws Exception {
        when(objectiveService.getObjectives(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/objectives"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_list_of_objectives_when_authenticated_user_has_objectives() throws Exception {
        Objective obj1 = new Objective(1L, 1L, 1, "Boire 2L d'eau", 0, "CUSTOM", null);
        Objective obj2 = new Objective(2L, 1L, 3, "30 min de sport", 1, "CUSTOM", null);

        when(objectiveService.getObjectives(1L)).thenReturn(List.of(obj1, obj2));

        mockMvc.perform(get("/api/objectives"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].label").value("Boire 2L d'eau"))
                .andExpect(jsonPath("$[0].dayOfWeek").value(1))
                .andExpect(jsonPath("$[1].label").value("30 min de sport"));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_201_when_authenticated_user_creates_a_valid_objective() throws Exception {
        Objective saved = new Objective(10L, 1L, 2, "Méditer 10 min", 0, "CUSTOM", null);

        when(objectiveService.createObjective(any(Objective.class))).thenReturn(saved);

        String body = objectMapper.writeValueAsString(new CreateObjectiveRequest(2, "Méditer 10 min", null, null));

        mockMvc.perform(post("/api/objectives")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.label").value("Méditer 10 min"))
                .andExpect(jsonPath("$.dayOfWeek").value(2));
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_204_when_authenticated_user_deletes_their_own_objective() throws Exception {
        doNothing().when(objectiveService).deleteObjective(5L, 1L);

        mockMvc.perform(delete("/api/objectives/5")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_404_when_authenticated_user_deletes_an_objective_that_does_not_exist() throws Exception {
        doThrow(new ObjectiveNotFoundException(99L)).when(objectiveService).deleteObjective(99L, 1L);

        mockMvc.perform(delete("/api/objectives/99")
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_403_when_authenticated_user_deletes_an_objective_that_belongs_to_another_user() throws Exception {
        doThrow(new ObjectiveAccessDeniedException(7L)).when(objectiveService).deleteObjective(7L, 1L);

        mockMvc.perform(delete("/api/objectives/7")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_201_when_authenticated_user_marks_an_objective_as_done_for_a_date() throws Exception {
        doNothing().when(objectiveService).markDone(anyLong(), anyLong(), any());

        mockMvc.perform(post("/api/objectives/5/completions/2026-06-10")
                        .with(csrf()))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_204_when_authenticated_user_unmarks_an_objective_for_a_date() throws Exception {
        doNothing().when(objectiveService).markUndone(anyLong(), anyLong(), any());

        mockMvc.perform(delete("/api/objectives/5/completions/2026-06-10")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "user")
    void should_return_completions_map_indexed_by_date_when_authenticated_user_queries_a_date_range() throws Exception {
        Map<String, List<Long>> completions = Map.of(
                "2026-06-03", List.of(10L, 11L),
                "2026-06-05", List.of(10L)
        );
        when(objectiveService.getCompletions(eq(1L), any(), any())).thenReturn(completions);

        mockMvc.perform(get("/api/objectives/completions")
                        .param("from", "2026-06-01")
                        .param("to", "2026-06-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$['2026-06-03'].length()").value(2))
                .andExpect(jsonPath("$['2026-06-05'].length()").value(1));
    }
}
