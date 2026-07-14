package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;

public class SavePushSubscriptionUseCase {

    private final PushSubscriptionRepository repository;

    public SavePushSubscriptionUseCase(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    public PushSubscription execute(Long userId, String endpoint, String p256dh, String auth) {
        PushSubscription subscription = new PushSubscription(null, userId, endpoint, p256dh, auth);
        return repository.saveOrUpdate(subscription);
    }
}
