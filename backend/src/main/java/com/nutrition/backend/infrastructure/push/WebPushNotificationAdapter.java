package com.nutrition.backend.infrastructure.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.exception.PushSubscriptionExpiredException;
import com.nutrition.backend.domain.ports.PushNotificationPort;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Security;
import java.util.Map;

@Component
public class WebPushNotificationAdapter implements PushNotificationPort {

    private static final Logger log = LoggerFactory.getLogger(WebPushNotificationAdapter.class);

    private final PushService pushService;
    private final ObjectMapper objectMapper;

    @Autowired
    public WebPushNotificationAdapter(
            @Value("${app.vapid.public-key}") String vapidPublicKey,
            @Value("${app.vapid.private-key}") String vapidPrivateKey,
            @Value("${app.vapid.subject}") String vapidSubject,
            ObjectMapper objectMapper) throws Exception {
        this(createPushService(vapidPublicKey, vapidPrivateKey, vapidSubject), objectMapper);
    }

    WebPushNotificationAdapter(PushService pushService, ObjectMapper objectMapper) {
        this.pushService = pushService;
        this.objectMapper = objectMapper;
    }

    private static PushService createPushService(String publicKey, String privateKey, String subject) throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        return new PushService(publicKey, privateKey, subject);
    }

    @Override
    public void send(PushSubscription subscription, String title, String body) {
        int status;
        try {
            String payload = objectMapper.writeValueAsString(Map.of("title", title, "body", body));
            Subscription sub = new Subscription(
                    subscription.endpoint(),
                    new Subscription.Keys(subscription.p256dh(), subscription.auth())
            );
            // La bibliothèque ne lève pas d'exception sur un refus : il faut lire le statut.
            status = pushService.send(new Notification(sub, payload)).getStatusLine().getStatusCode();
        } catch (Exception e) {
            log.error("[PUSH] Erreur envoi notification : {}", e.getMessage());
            throw new RuntimeException("Échec de l'envoi push", e);
        }
        if (status == 404 || status == 410) {
            throw new PushSubscriptionExpiredException(subscription.endpoint());
        }
        if (status < 200 || status >= 300) {
            throw new RuntimeException("Envoi push refusé (HTTP " + status + ")");
        }
    }
}
