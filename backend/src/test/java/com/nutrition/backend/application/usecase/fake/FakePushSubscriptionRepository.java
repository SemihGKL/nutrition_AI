package com.nutrition.backend.application.usecase.fake;

import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;

import java.util.ArrayList;
import java.util.List;

public class FakePushSubscriptionRepository implements PushSubscriptionRepository {

    private final List<PushSubscription> store = new ArrayList<>();

    @Override
    public PushSubscription saveOrUpdate(PushSubscription subscription) {
        store.removeIf(s -> s.endpoint().equals(subscription.endpoint()));
        store.add(subscription);
        return subscription;
    }

    @Override
    public void deleteByEndpointForUser(String endpoint, Long userId) {
        store.removeIf(s -> s.endpoint().equals(endpoint) && s.userId().equals(userId));
    }

    @Override
    public List<PushSubscription> findPendingWeighInReminders(String dayOfWeek, String weekStartDate) {
        return List.of();
    }

    @Override
    public List<PushSubscription> findByUserId(Long userId) {
        return store.stream().filter(s -> s.userId().equals(userId)).toList();
    }
}
