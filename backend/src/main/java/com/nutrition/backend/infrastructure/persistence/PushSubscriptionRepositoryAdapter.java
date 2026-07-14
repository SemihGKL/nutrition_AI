package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
public class PushSubscriptionRepositoryAdapter implements PushSubscriptionRepository {

    private final PushSubscriptionJpaRepository jpaRepository;

    public PushSubscriptionRepositoryAdapter(PushSubscriptionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    @Transactional
    public PushSubscription saveOrUpdate(PushSubscription subscription) {
        Optional<PushSubscriptionJpaEntity> existing = jpaRepository.findByEndpoint(subscription.endpoint());
        PushSubscriptionJpaEntity entity;
        if (existing.isPresent()) {
            entity = existing.get();
            entity.setP256dh(subscription.p256dh());
            entity.setAuth(subscription.auth());
        } else {
            entity = new PushSubscriptionJpaEntity(
                    null, subscription.userId(), subscription.endpoint(),
                    subscription.p256dh(), subscription.auth()
            );
        }
        PushSubscriptionJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional
    public void deleteByEndpoint(String endpoint) {
        jpaRepository.deleteByEndpoint(endpoint);
    }

    @Override
    public List<PushSubscription> findPendingWeighInReminders(String dayOfWeek, String weekStartDate) {
        return jpaRepository.findPendingWeighInReminders(dayOfWeek, weekStartDate)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    private PushSubscription toDomain(PushSubscriptionJpaEntity entity) {
        return new PushSubscription(entity.getId(), entity.getUserId(),
                entity.getEndpoint(), entity.getP256dh(), entity.getAuth());
    }
}
