package com.nutrition.backend.infrastructure.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Le profil prod doit déclarer toutes les propriétés lues par des @Value sans valeur par
 * défaut, sinon le contexte Spring ne démarre pas sur le VPS.
 */
class ProdProfilePropertiesTest {

    private Properties prodProperties() throws IOException {
        Properties props = new Properties();
        try (InputStream in = getClass().getResourceAsStream("/application-prod.properties")) {
            props.load(in);
        }
        return props;
    }

    @Test
    void should_declare_vapid_keys_from_environment_in_prod_profile() throws IOException {
        Properties props = prodProperties();

        assertThat(props.getProperty("app.vapid.public-key")).isEqualTo("${VAPID_PUBLIC_KEY}");
        assertThat(props.getProperty("app.vapid.private-key")).isEqualTo("${VAPID_PRIVATE_KEY}");
        assertThat(props.getProperty("app.vapid.subject")).startsWith("${VAPID_SUBJECT");
    }
}
