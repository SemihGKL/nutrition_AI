package com.nutrition.backend.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Class.UserObjective;
import com.nutrition.backend.Exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.Exception.ObjectiveNotFoundException;
import com.nutrition.backend.Service.ObjectiveService;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.dto.CreateObjectiveRequest;
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
    UserService userService;

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
        UserObjective obj1 = new UserObjective();
        obj1.setId(1L);
        obj1.setDayOfWeek(1);
        obj1.setLabel("Boire 2L d'eau");
        obj1.setPosition(0);

        UserObjective obj2 = new UserObjective();
        obj2.setId(2L);
        obj2.setDayOfWeek(3);
        obj2.setLabel("30 min de sport");
        obj2.setPosition(1);

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
        UserObjective saved = new UserObjective();
        saved.setId(10L);
        saved.setUserId(1L);
        saved.setDayOfWeek(2);
        saved.setLabel("Méditer 10 min");
        saved.setPosition(0);

        when(objectiveService.createObjective(any(UserObjective.class))).thenReturn(saved);

        String body = objectMapper.writeValueAsString(new CreateObjectiveRequest(2, "Méditer 10 min"));

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
