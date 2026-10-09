package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.ports.PushSubscriptionRepository;

public class DeletePushSubscriptionUseCase {

    private final PushSubscriptionRepository repository;

    public DeletePushSubscriptionUseCase(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    public void execute(Long userId, String endpoint) {
        repository.deleteByEndpointForUser(endpoint, userId);
    }
}
