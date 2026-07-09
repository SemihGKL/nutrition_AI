package com.nutrition.backend.infrastructure.config;

import com.nutrition.backend.application.usecase.RequestPasswordResetUseCase;
import com.nutrition.backend.application.usecase.ResetPasswordUseCase;
import com.nutrition.backend.application.usecase.SendSupportMessageUseCase;
import com.nutrition.backend.domain.ports.EmailPort;
import com.nutrition.backend.domain.ports.PasswordEncoderPort;
import com.nutrition.backend.domain.ports.PasswordResetTokenRepository;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.MbrCalculator;
import com.nutrition.backend.domain.service.PasswordPolicy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DomainConfig {

    @Bean
    public MbrCalculator mbrCalculator() {
        return new MbrCalculator();
    }

    @Bean
    public PasswordPolicy passwordPolicy() {
        return new PasswordPolicy();
    }

    @Bean
    public RequestPasswordResetUseCase requestPasswordResetUseCase(UserRepository userRepository,
                                                                    PasswordResetTokenRepository tokenRepository,
                                                                    EmailPort emailPort) {
        return new RequestPasswordResetUseCase(userRepository, tokenRepository, emailPort);
    }

    @Bean
    public ResetPasswordUseCase resetPasswordUseCase(UserRepository userRepository,
                                                     PasswordResetTokenRepository tokenRepository,
                                                     PasswordEncoderPort passwordEncoder,
                                                     PasswordPolicy passwordPolicy) {
        return new ResetPasswordUseCase(userRepository, tokenRepository, passwordEncoder, passwordPolicy);
    }

    @Bean
    public SendSupportMessageUseCase sendSupportMessageUseCase(EmailPort emailPort) {
        return new SendSupportMessageUseCase(emailPort);
    }
}
