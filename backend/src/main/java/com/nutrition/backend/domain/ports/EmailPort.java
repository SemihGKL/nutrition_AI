package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.model.SupportCategory;

public interface EmailPort {
    void sendPasswordResetEmail(String toEmail, String resetLink);

    void sendSupportEmail(String reporterEmail, SupportCategory category, String message);
}