package com.nutrition.backend.infrastructure.email;

import com.nutrition.backend.domain.model.SupportCategory;
import com.nutrition.backend.domain.ports.EmailPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SpringMailEmailAdapter implements EmailPort {

    private static final Logger log = LoggerFactory.getLogger(SpringMailEmailAdapter.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String supportEmail;

    public SpringMailEmailAdapter(JavaMailSender mailSender,
                                  @Value("${spring.mail.username}") String fromEmail,
                                  @Value("${app.support-email:support@kaloriim.app}") String supportEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.supportEmail = supportEmail;
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Réinitialisation de votre mot de passe Kaloriim");
        message.setText("Bonjour,\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n\n"
                + resetLink
                + "\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas fait cette demande, ignorez cet email.");
        log.info("[MAIL] Envoi reset password → {}", toEmail);
        try {
            mailSender.send(message);
            log.info("[MAIL] Reset password envoyé → {}", toEmail);
        } catch (Exception e) {
            log.error("[MAIL] Échec envoi reset password → {} : {}", toEmail, e.getMessage());
            throw e;
        }
    }

    @Override
    public void sendSupportEmail(String reporterEmail, SupportCategory category, String message) {
        String safeReporter = sanitizeHeader(reporterEmail);
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(fromEmail);
        mail.setTo(supportEmail);
        mail.setReplyTo(safeReporter);
        mail.setSubject("[Support Kaloriim] " + category.label() + " — " + safeReporter);
        mail.setText("Catégorie : " + category.label() + "\n"
                + "Utilisateur : " + safeReporter + "\n\n"
                + "Message :\n" + message);
        log.info("[MAIL] Envoi support ({}) de {}", category.label(), safeReporter);
        try {
            mailSender.send(mail);
            log.info("[MAIL] Support envoyé ({}) de {}", category.label(), safeReporter);
        } catch (Exception e) {
            log.error("[MAIL] Échec envoi support ({}) de {} : {}", category.label(), safeReporter, e.getMessage());
            throw e;
        }
    }

    /**
     * Neutralise l'injection d'en-têtes : un champ destiné à un en-tête (sujet,
     * reply-to) ne doit jamais contenir de saut de ligne.
     */
    private String sanitizeHeader(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("[\\r\\n]", " ").trim();
    }
}
