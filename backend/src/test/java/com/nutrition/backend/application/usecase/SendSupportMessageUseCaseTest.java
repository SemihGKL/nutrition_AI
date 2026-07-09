package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.SpyEmailPort;
import com.nutrition.backend.domain.model.SupportCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SendSupportMessageUseCaseTest {

    private SpyEmailPort emailPort;
    private SendSupportMessageUseCase useCase;

    @BeforeEach
    void setUp() {
        emailPort = new SpyEmailPort();
        useCase = new SendSupportMessageUseCase(emailPort);
    }

    @Test
    void should_send_a_support_email_with_reporter_category_and_message_when_message_is_present() {
        // When
        useCase.execute("alice@example.com", SupportCategory.IMPROVEMENT, "Ajoutez un mode sombre svp");

        // Then
        assertThat(emailPort.wasSupportEmailSent()).isTrue();
        assertThat(emailPort.getLastSupportReporter()).isEqualTo("alice@example.com");
        assertThat(emailPort.getLastSupportCategory()).isEqualTo(SupportCategory.IMPROVEMENT);
        assertThat(emailPort.getLastSupportMessage()).isEqualTo("Ajoutez un mode sombre svp");
    }

    @Test
    void should_throw_exception_when_message_is_blank() {
        assertThatThrownBy(() -> useCase.execute("alice@example.com", SupportCategory.PROBLEM, "   "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_not_send_any_email_when_message_is_blank() {
        try {
            useCase.execute("alice@example.com", SupportCategory.PROBLEM, "");
        } catch (IllegalArgumentException ignored) {
            // attendu
        }

        assertThat(emailPort.wasSupportEmailSent()).isFalse();
    }
}
