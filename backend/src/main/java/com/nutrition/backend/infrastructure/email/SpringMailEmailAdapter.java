package com.nutrition.backend.infrastructure.email;

import com.nutrition.backend.domain.ports.EmailPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SpringMailEmailAdapter implements EmailPort {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public SpringMailEmailAdapter(JavaMailSender mailSender,
                                  @Value("${spring.mail.username}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
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
}
