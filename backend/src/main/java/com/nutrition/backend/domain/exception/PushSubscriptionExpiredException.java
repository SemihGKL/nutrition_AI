package com.nutrition.backend.domain.exception;

/** L'appareil n'existe plus côté service push (404/410) : l'abonnement est à supprimer. */
public class PushSubscriptionExpiredException extends RuntimeException {
    public PushSubscriptionExpiredException(String endpoint) {
        super("Abonnement push expiré : " + endpoint);
    }
}
