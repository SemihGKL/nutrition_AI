package com.nutrition.backend.infrastructure.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.StandardEnvironment;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Charge un fichier {@code .env} (confort de développement).
 * <ul>
 *   <li>En prod, il est ignoré : la configuration vient uniquement de systemd
 *       (EnvironmentFile) et un {@code .env} oublié sur le VPS ne doit rien écraser.</li>
 *   <li>En dev, il complète les variables d'environnement sans jamais les remplacer.</li>
 * </ul>
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_NAME = "dotenv";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Dotenv dotenv = Dotenv.configure()
                .directory(System.getProperty("user.dir"))
                .ignoreIfMissing()
                .load();

        Map<String, Object> entries = new HashMap<>();
        dotenv.entries().forEach(e -> entries.put(e.getKey(), e.getValue()));
        apply(environment, entries);
    }

    void apply(ConfigurableEnvironment environment, Map<String, Object> dotenvEntries) {
        if (dotenvEntries.isEmpty() || isProduction(environment)) return;

        MapPropertySource dotenv = new MapPropertySource(SOURCE_NAME, new HashMap<>(dotenvEntries));
        MutablePropertySources sources = environment.getPropertySources();
        String systemEnvironment = StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME;
        if (sources.contains(systemEnvironment)) {
            sources.addAfter(systemEnvironment, dotenv); // les vraies variables gardent la priorité
        } else {
            sources.addLast(dotenv);
        }
    }

    private static boolean isProduction(ConfigurableEnvironment environment) {
        String profiles = environment.getProperty("SPRING_PROFILES_ACTIVE",
                environment.getProperty("spring.profiles.active", ""));
        return Arrays.stream(profiles.split(",")).map(String::trim).anyMatch("prod"::equals);
    }
}
