package com.nutrition.backend.infrastructure.email;

import com.nutrition.backend.domain.model.SupportCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SpringMailEmailAdapterTest {

    private JavaMailSender mailSender;
    private SpringMailEmailAdapter adapter;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        adapter = new SpringMailEmailAdapter(mailSender, "noreply@kaloriim.app", "support@kaloriim.app");
    }

    private SimpleMailMessage captureSentMessage() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        return captor.getValue();
    }

    @Test
    void should_send_the_support_email_to_the_configured_support_address() {
        adapter.sendSupportEmail("alice@example.com", SupportCategory.PROBLEM, "Une page plante");

        SimpleMailMessage sent = captureSentMessage();
        assertThat(sent.getTo()).containsExactly("support@kaloriim.app");
        assertThat(sent.getFrom()).isEqualTo("noreply@kaloriim.app");
    }

    @Test
    void should_set_the_reporter_email_as_reply_to_so_support_can_answer_directly() {
        adapter.sendSupportEmail("alice@example.com", SupportCategory.PROBLEM, "Une page plante");

        SimpleMailMessage sent = captureSentMessage();
        assertThat(sent.getReplyTo()).isEqualTo("alice@example.com");
    }

    @Test
    void should_include_the_category_label_and_reporter_in_the_subject() {
        adapter.sendSupportEmail("alice@example.com", SupportCategory.IMPROVEMENT, "Ajoutez un mode sombre");

        SimpleMailMessage sent = captureSentMessage();
        assertThat(sent.getSubject())
                .contains("Amélioration")
                .contains("alice@example.com");
    }

    @Test
    void should_include_the_category_reporter_and_message_in_the_body() {
        adapter.sendSupportEmail("alice@example.com", SupportCategory.IMPROVEMENT, "Ajoutez un mode sombre");

        SimpleMailMessage sent = captureSentMessage();
        assertThat(sent.getText())
                .contains("Amélioration")
                .contains("alice@example.com")
                .contains("Ajoutez un mode sombre");
    }

    @Test
    void should_strip_line_breaks_from_header_fields_to_prevent_email_header_injection() {
        adapter.sendSupportEmail("alice@example.com\r\nBcc: victim@example.com",
                SupportCategory.PROBLEM, "Une page plante");

        SimpleMailMessage sent = captureSentMessage();
        assertThat(sent.getSubject()).doesNotContain("\r").doesNotContain("\n");
        assertThat(sent.getReplyTo()).doesNotContain("\r").doesNotContain("\n");
    }
}
