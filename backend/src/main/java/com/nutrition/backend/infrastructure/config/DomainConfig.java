package com.nutrition.backend.infrastructure.config;

import com.nutrition.backend.domain.service.MbrCalculator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DomainConfig {

    @Bean
    public MbrCalculator mbrCalculator() {
        return new MbrCalculator();
    }
}
