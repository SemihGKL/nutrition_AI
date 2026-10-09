package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.DeletePushSubscriptionUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.SavePushSubscriptionUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PushSubscriptionController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000",
        "app.vapid.public-key=test-public-key"
})
class PushSubscriptionControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean TokenService tokenService;
    @MockBean GetUserProfileUseCase getUserProfileUseCase;
    @MockBean SavePushSubscriptionUseCase savePushSubscriptionUseCase;
    @MockBean DeletePushSubscriptionUseCase deletePushSubscriptionUseCase;

    @BeforeEach
    void setUp() {
        when(getUserProfileUseCase.byEmail("user")).thenReturn(new User(7L, "Test", "test@example.com", "hashed",
                Gender.MALE, 28, 178.0, 85.0, 85.0, 1950, 75, "MONDAY", null));
    }

    @Test
    @WithMockUser(username = "user")
    void should_detach_the_device_for_the_authenticated_user_only() throws Exception {
        mockMvc.perform(post("/api/push/unsubscribe").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endpoint\":\"https://push.example/device-1\"}"))
                .andExpect(status().isNoContent());

        verify(deletePushSubscriptionUseCase).execute(7L, "https://push.example/device-1");
    }

    @Test
    void should_return_401_when_unsubscribing_without_authentication() throws Exception {
        mockMvc.perform(post("/api/push/unsubscribe").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endpoint\":\"https://push.example/device-1\"}"))
                .andExpect(status().isUnauthorized());
    }
}
