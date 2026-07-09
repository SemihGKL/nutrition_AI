package com.nutrition.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Smoke test de câblage : démarre le contexte Spring complet sur une base H2
 * (Flyway désactivé, profil dev exclu) pour garantir que le graphe de beans
 * est valide — notamment l'injection de {@code PasswordPolicy} dans les use
 * cases et l'enregistrement du filtre de limitation de débit.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ctxtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        "spring.mail.host=localhost",
        "spring.mail.username=noreply@test.local"
})
class ApplicationContextLoadsTest {

    @Test
    void context_loads() {
        // Le simple démarrage du contexte suffit : un bean manquant ferait échouer ce test.
    }
}
