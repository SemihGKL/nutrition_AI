package com.nutrition.backend.domain.entity;

public record PushSubscription(Long id, Long userId, String endpoint, String p256dh, String auth) {}
