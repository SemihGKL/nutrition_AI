package com.nutrition.backend.Config;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class DataInitializer {

    @Bean
    ApplicationRunner seedTestUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("test@test.com").isPresent()) return;

            User user = new User();
            user.setUsername("Test");
            user.setEmail("test@test.com");
            user.setPassword(passwordEncoder.encode("test1234"));
            user.setGender("MALE");
            user.setAge(28);
            user.setHeight(178.0);
            user.setStartWeight(82.0);
            user.setCurrentWeight(82.0);
            user.setWeightGoal(75);
            user.setDailyCalorieGoal(1950);

            userRepository.save(user);
        };
    }
}
