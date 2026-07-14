package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.PushSubscription;

public interface PushNotificationPort {
    void send(PushSubscription subscription, String title, String body);
}
