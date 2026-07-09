package com.nutrition.backend.infrastructure.email;

import com.nutrition.backend.domain.model.SupportCategory;
import com.nutrition.backend.domain.ports.EmailPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SpringMailEmailAdapter implements EmailPort {

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
        mailSender.send(message);
    }

    @Override
    public void sendSupportEmail(String reporterEmail, SupportCategory category, String message) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(fromEmail);
        mail.setTo(supportEmail);
        mail.setReplyTo(reporterEmail);
        mail.setSubject("[Support Kaloriim] " + category.label() + " — " + reporterEmail);
        mail.setText("Catégorie : " + category.label() + "\n"
                + "Utilisateur : " + reporterEmail + "\n\n"
                + "Message :\n" + message);
        mailSender.send(mail);
    }
}
