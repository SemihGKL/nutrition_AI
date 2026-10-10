package com.nutrition.backend.infrastructure.config;

import com.nutrition.backend.infrastructure.ratelimit.RateLimitFilter;
import com.nutrition.backend.infrastructure.ratelimit.RateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    /** Limite les tentatives d'authentification (login/register/reset) par IP. */
    @Value("${app.rate-limit.auth.capacity:10}")
    private long authCapacity;

    @Value("${app.rate-limit.auth.refill-seconds:60}")
    private long authRefillSeconds;

    /** Limite l'envoi de messages support, par utilisateur authentifié (IP en repli). */
    @Value("${app.rate-limit.support.capacity:5}")
    private long supportCapacity;

    @Value("${app.rate-limit.support.refill-seconds:60}")
    private long supportRefillSeconds;

    /** Limite le rafraîchissement de session par IP (compteur distinct, plus large). */
    @Value("${app.rate-limit.refresh.capacity:30}")
    private long refreshCapacity;

    @Value("${app.rate-limit.refresh.refill-seconds:60}")
    private long refreshRefillSeconds;

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration() {
        RateLimiter authLimiter = new RateLimiter(authCapacity, Duration.ofSeconds(authRefillSeconds));
        RateLimiter supportLimiter = new RateLimiter(supportCapacity, Duration.ofSeconds(supportRefillSeconds));
        RateLimiter refreshLimiter = new RateLimiter(refreshCapacity, Duration.ofSeconds(refreshRefillSeconds));

        FilterRegistrationBean<RateLimitFilter> registration =
                new FilterRegistrationBean<>(new RateLimitFilter(authLimiter, supportLimiter, refreshLimiter));
        registration.addUrlPatterns("/api/*");
        // Après la chaîne Spring Security (ordre -100) pour que l'identité soit
        // disponible sur /api/support ; les endpoints /api/auth restent comptés par IP.
        registration.setOrder(0);
        return registration;
    }
}
