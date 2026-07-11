package com.nutrition.backend.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.application.usecase.SendSupportMessageUseCase;
import com.nutrition.backend.domain.model.SupportCategory;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.infrastructure.web.dto.SupportRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SupportController.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "jwt.expiration=86400000"
})
class SupportControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    TokenService tokenService;

    @MockBean
    SendSupportMessageUseCase sendSupportMessageUseCase;

    @Test
    @WithMockUser(username = "user@example.com")
    void should_return_204_and_forward_the_reporter_email_when_message_is_sent() throws Exception {
        String body = objectMapper.writeValueAsString(
                new SupportRequest("IMPROVEMENT", "Ajoutez un mode sombre svp"));

        mockMvc.perform(post("/api/support")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());

        verify(sendSupportMessageUseCase).execute(
                eq("user@example.com"),
                eq(SupportCategory.IMPROVEMENT),
                eq("Ajoutez un mode sombre svp"));
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void should_return_400_when_category_is_unknown() throws Exception {
        String body = objectMapper.writeValueAsString(
                new SupportRequest("SOMETHING_ELSE", "Un message"));

        mockMvc.perform(post("/api/support")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void should_return_400_when_the_use_case_rejects_a_blank_message() throws Exception {
        doThrow(new IllegalArgumentException("Le message ne peut pas être vide"))
                .when(sendSupportMessageUseCase).execute(any(), any(), any());

        String body = objectMapper.writeValueAsString(
                new SupportRequest("PROBLEM", "   "));

        mockMvc.perform(post("/api/support")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void should_return_400_when_message_exceeds_max_length() throws Exception {
        String tooLong = "a".repeat(2001);
        String body = objectMapper.writeValueAsString(
                new SupportRequest("PROBLEM", tooLong));

        mockMvc.perform(post("/api/support")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_401_when_not_authenticated() throws Exception {
        String body = objectMapper.writeValueAsString(
                new SupportRequest("PROBLEM", "Un bug à signaler"));

        mockMvc.perform(post("/api/support")
                        .with(anonymous())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
