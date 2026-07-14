package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.PushSubscription;

import java.util.List;

public interface PushSubscriptionRepository {
    PushSubscription saveOrUpdate(PushSubscription subscription);
    void deleteByEndpoint(String endpoint);
    List<PushSubscription> findPendingWeighInReminders(String dayOfWeek, String weekStartDate);
}
