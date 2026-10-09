package com.nutrition.backend.domain.model;

import java.util.Locale;

/** Les adresses email sont comparées sans tenir compte de la casse ni des espaces autour. */
public final class EmailAddress {

    private EmailAddress() {}

    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
