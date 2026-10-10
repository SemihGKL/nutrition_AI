package com.nutrition.backend.infrastructure.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DotenvEnvironmentPostProcessorTest {

    private final DotenvEnvironmentPostProcessor processor = new DotenvEnvironmentPostProcessor();

    /** Environnement dont les variables système sont contrôlées par le test. */
    private static StandardEnvironment environmentWithSystemVariables(Map<String, Object> variables) {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().replace(
                StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                new SystemEnvironmentPropertySource(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                        new HashMap<>(variables)));
        return environment;
    }

    @Test
    void should_ignore_dotenv_file_in_production() {
        StandardEnvironment environment = environmentWithSystemVariables(
                Map.of("SPRING_PROFILES_ACTIVE", "prod", "JWT_SECRET", "secret-de-prod"));

        processor.apply(environment, Map.of("SPRING_PROFILES_ACTIVE", "dev", "JWT_SECRET", "secret-de-dev", "EXTRA", "x"));

        assertThat(environment.getProperty("SPRING_PROFILES_ACTIVE")).isEqualTo("prod");
        assertThat(environment.getProperty("JWT_SECRET")).isEqualTo("secret-de-prod");
        assertThat(environment.getProperty("EXTRA")).isNull();
    }

    @Test
    void should_never_override_a_real_environment_variable_in_dev() {
        StandardEnvironment environment = environmentWithSystemVariables(Map.of("DB_PASSWORD", "depuis-le-shell"));

        processor.apply(environment, Map.of("DB_PASSWORD", "depuis-le-fichier"));

        assertThat(environment.getProperty("DB_PASSWORD")).isEqualTo("depuis-le-shell");
    }

    @Test
    void should_provide_values_missing_from_the_environment_in_dev() {
        StandardEnvironment environment = environmentWithSystemVariables(Map.of());

        processor.apply(environment, Map.of("VAPID_PUBLIC_KEY", "cle-de-dev"));

        assertThat(environment.getProperty("VAPID_PUBLIC_KEY")).isEqualTo("cle-de-dev");
    }
}
