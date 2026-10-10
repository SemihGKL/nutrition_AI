package com.nutrition.backend.domain.exception;

/** Un objectif ne se coche que le jour pour lequel il est prévu (ou tous les jours si -1). */
public class ObjectiveNotScheduledException extends RuntimeException {
    public ObjectiveNotScheduledException(Long objectiveId) {
        super("L'objectif " + objectiveId + " n'est pas prévu ce jour-là");
    }
}
