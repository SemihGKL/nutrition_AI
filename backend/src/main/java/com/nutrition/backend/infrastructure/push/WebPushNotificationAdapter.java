package com.nutrition.backend.infrastructure.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.ports.PushNotificationPort;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Security;
import java.util.Map;

@Component
public class WebPushNotificationAdapter implements PushNotificationPort {

    private static final Logger log = LoggerFactory.getLogger(WebPushNotificationAdapter.class);

    private final PushService pushService;
    private final ObjectMapper objectMapper;

    public WebPushNotificationAdapter(
            @Value("${app.vapid.public-key}") String vapidPublicKey,
            @Value("${app.vapid.private-key}") String vapidPrivateKey,
            @Value("${app.vapid.subject}") String vapidSubject,
            ObjectMapper objectMapper) throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
        this.objectMapper = objectMapper;
    }

    @Override
    public void send(PushSubscription subscription, String title, String body) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of("title", title, "body", body));
            Subscription sub = new Subscription(
                    subscription.endpoint(),
                    new Subscription.Keys(subscription.p256dh(), subscription.auth())
            );
            Notification notification = new Notification(sub, payload);
            pushService.send(notification);
        } catch (Exception e) {
            log.error("[PUSH] Erreur envoi notification : {}", e.getMessage());
            throw new RuntimeException("Échec de l'envoi push", e);
        }
    }
}
