package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.model.SupportCategory;
import com.nutrition.backend.domain.ports.EmailPort;

public class SendSupportMessageUseCase {

    private final EmailPort emailPort;

    public SendSupportMessageUseCase(EmailPort emailPort) {
        this.emailPort = emailPort;
    }

    public void execute(String reporterEmail, SupportCategory category, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Le message ne peut pas être vide");
        }
        emailPort.sendSupportEmail(reporterEmail, category, message);
    }
}
