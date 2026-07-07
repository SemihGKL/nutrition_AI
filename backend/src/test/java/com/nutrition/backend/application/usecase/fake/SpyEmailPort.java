package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.ports.EmailPort;

public class SpyEmailPort implements EmailPort {

    private String lastSentTo;
    private String lastSentLink;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        this.lastSentTo = toEmail;
        this.lastSentLink = resetLink;
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
}
