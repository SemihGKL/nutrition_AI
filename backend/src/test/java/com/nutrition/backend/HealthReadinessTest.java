package com.nutrition.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * La sonde du déploiement (deploy/release.sh) interroge /actuator/health/readiness : elle
 * ne doit dépendre que de l'application et de la base, pas du serveur mail. Sinon un
 * incident SMTP ferait revenir à la version précédente une release parfaitement saine.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:readiness;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "jwt.secret=test-secret-key-that-is-at-least-32-characters-long",
        // Serveur mail injoignable : la santé globale tombe, la readiness doit rester UP.
        "spring.mail.host=127.0.0.1",
        "spring.mail.port=1",
        "spring.mail.username=noreply@test.local"
})
class HealthReadinessTest {

    @Autowired MockMvc mockMvc;

    @Test
    void should_report_ready_when_only_the_mail_server_is_down() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void should_include_the_database_in_readiness() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness").with(r -> { r.setRemoteAddr("127.0.0.1"); return r; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.db.status").value("UP"));
    }
}
