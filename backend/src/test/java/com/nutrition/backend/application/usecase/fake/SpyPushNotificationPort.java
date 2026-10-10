package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.exception.PushSubscriptionExpiredException;
import com.nutrition.backend.domain.ports.PushNotificationPort;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class SpyPushNotificationPort implements PushNotificationPort {

    public record Sent(String endpoint, String title, String body) {}

    private final List<Sent> sent = new ArrayList<>();
    private final Set<String> failingEndpoints = new HashSet<>();
    private final Set<String> expiredEndpoints = new HashSet<>();

    public void failFor(String endpoint) {
        failingEndpoints.add(endpoint);
    }

    /** Simule un appareil désinstallé : le service push répond 404/410. */
    public void expireFor(String endpoint) {
        expiredEndpoints.add(endpoint);
    }

    @Override
    public void send(PushSubscription subscription, String title, String body) {
        if (expiredEndpoints.contains(subscription.endpoint())) {
            throw new PushSubscriptionExpiredException(subscription.endpoint());
        }
        if (failingEndpoints.contains(subscription.endpoint())) {
            throw new RuntimeException("push KO");
        }
        sent.add(new Sent(subscription.endpoint(), title, body));
    }

    public List<Sent> sent() {
        return List.copyOf(sent);
    }
}
