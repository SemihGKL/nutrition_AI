package com.nutrition.backend.Config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class EnvConfigRunner implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        System.out.println("EnvConfigRunner is executing...");
        Dotenv dotenv = Dotenv.load();

        // Chargement des variables d'environnement à partir du fichier .env
        String dbUsername = dotenv.get("DB_USERNAME");
        String dbPassword = dotenv.get("DB_PASSWORD");

        // Log des valeurs pour vérification
        System.out.println("DB Username: " + dbUsername);

        // Tu peux aussi injecter ces valeurs dans la configuration Spring Boot
        System.setProperty("spring.datasource.username", dbUsername);
        System.setProperty("spring.datasource.password", dbPassword);
    }
}
