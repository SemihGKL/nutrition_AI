package com.nutrition.backend.infrastructure.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limiteur de débit en mémoire, par clé (adresse IP ou identité utilisateur).
 * <p>
 * Chaque clé dispose d'un seau à jetons ({@code capacity} jetons, rechargés
 * intégralement sur {@code refillPeriod}). Adapté à une instance unique ;
 * pour un déploiement multi-instances, remplacer le stockage par un backend
 * partagé (ex. Redis) via l'API Bucket4j distribuée.
 */
public class RateLimiter {

    private final long capacity;
    private final Duration refillPeriod;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimiter(long capacity, Duration refillPeriod) {
        this.capacity = capacity;
        this.refillPeriod = refillPeriod;
    }

    public boolean tryConsume(String key) {
        return buckets.computeIfAbsent(key, k -> newBucket()).tryConsume(1);
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.simple(capacity, refillPeriod);
        return Bucket.builder().addLimit(limit).build();
    }
}
