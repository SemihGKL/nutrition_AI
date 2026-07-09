package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.model.SupportCategory;
import com.nutrition.backend.domain.ports.EmailPort;

public class SpyEmailPort implements EmailPort {

    private String lastSentTo;
    private String lastSentLink;

    private String lastSupportReporter;
    private SupportCategory lastSupportCategory;
    private String lastSupportMessage;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        this.lastSentTo = toEmail;
        this.lastSentLink = resetLink;
    }

    @Override
    public void sendSupportEmail(String reporterEmail, SupportCategory category, String message) {
        this.lastSupportReporter = reporterEmail;
        this.lastSupportCategory = category;
        this.lastSupportMessage = message;
    }

    public String getLastSentTo() {
        return lastSentTo;
    }

    public String getLastSentLink() {
        return lastSentLink;
    }

    public boolean wasEmailSent() {
        return lastSentTo != null;
    }

    public String getLastSupportReporter() {
        return lastSupportReporter;
    }

    public SupportCategory getLastSupportCategory() {
        return lastSupportCategory;
    }

    public String getLastSupportMessage() {
        return lastSupportMessage;
    }

    public boolean wasSupportEmailSent() {
        return lastSupportMessage != null;
    }
}
