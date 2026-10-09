package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.PushSubscription;

import java.util.List;

public interface PushSubscriptionRepository {
    /** Crée l'abonnement, ou le rattache au nouvel utilisateur si l'appareil est déjà connu. */
    PushSubscription saveOrUpdate(PushSubscription subscription);
    /** Détache l'appareil, uniquement s'il appartient à cet utilisateur. */
    void deleteByEndpointForUser(String endpoint, Long userId);
    List<PushSubscription> findPendingWeighInReminders(String dayOfWeek, String weekStartDate);
    List<PushSubscription> findByUserId(Long userId);
}
