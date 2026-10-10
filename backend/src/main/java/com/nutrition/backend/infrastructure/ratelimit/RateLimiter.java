package com.nutrition.backend.infrastructure.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Limiteur de débit en mémoire, par clé (adresse IP ou identité utilisateur).
 * <p>
 * Chaque clé dispose d'un seau à jetons ({@code capacity} jetons, rechargés
 * intégralement sur {@code refillPeriod}). Adapté à une instance unique ;
 * pour un déploiement multi-instances, remplacer le stockage par un backend
 * partagé (ex. Redis) via l'API Bucket4j distribuée.
 * <p>
 * Mémoire bornée : une clé inactive depuis au moins {@code refillPeriod} est oubliée
 * (son seau serait de nouveau plein, l'oublier ne change donc rien au comptage).
 * Sans ça, chaque adresse vue resterait en mémoire indéfiniment.
 */
public class RateLimiter {

    private record Entry(Bucket bucket, Instant lastAccess) {}

    private final long capacity;
    private final Duration refillPeriod;
    private final Clock clock;
    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private final AtomicReference<Instant> lastCleanup;

    public RateLimiter(long capacity, Duration refillPeriod) {
        this(capacity, refillPeriod, Clock.systemUTC());
    }

    public RateLimiter(long capacity, Duration refillPeriod, Clock clock) {
        this.capacity = capacity;
        this.refillPeriod = refillPeriod;
        this.clock = clock;
        this.lastCleanup = new AtomicReference<>(clock.instant());
    }

    public boolean tryConsume(String key) {
        Instant now = clock.instant();
        evictIdleKeysIfDue(now);
        Entry entry = entries.compute(key, (k, existing) ->
                new Entry(existing != null ? existing.bucket() : newBucket(), now));
        return entry.bucket().tryConsume(1);
    }

    /** Nombre de clés suivies (exposé pour vérifier que la mémoire reste bornée). */
    int trackedKeys() {
        return entries.size();
    }

    private void evictIdleKeysIfDue(Instant now) {
        Instant previous = lastCleanup.get();
        if (Duration.between(previous, now).compareTo(refillPeriod) < 0) return;
        if (!lastCleanup.compareAndSet(previous, now)) return; // un autre thread s'en charge
        Instant idleThreshold = now.minus(refillPeriod);
        entries.values().removeIf(e -> !e.lastAccess().isAfter(idleThreshold));
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.simple(capacity, refillPeriod);
        return Bucket.builder().addLimit(limit).build();
    }
}
