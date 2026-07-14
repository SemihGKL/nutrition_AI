package com.nutrition.backend.infrastructure.config;

import com.nutrition.backend.application.usecase.DeletePushSubscriptionUseCase;
import com.nutrition.backend.application.usecase.SavePushSubscriptionUseCase;
import com.nutrition.backend.application.usecase.SendWeighInReminderUseCase;
import com.nutrition.backend.domain.ports.PushNotificationPort;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class VapidConfig {

    @Bean
    public SavePushSubscriptionUseCase savePushSubscriptionUseCase(PushSubscriptionRepository repository) {
        return new SavePushSubscriptionUseCase(repository);
    }

    @Bean
    public DeletePushSubscriptionUseCase deletePushSubscriptionUseCase(PushSubscriptionRepository repository) {
        return new DeletePushSubscriptionUseCase(repository);
    }

    @Bean
    public SendWeighInReminderUseCase sendWeighInReminderUseCase(PushSubscriptionRepository repository,
                                                                  PushNotificationPort pushNotificationPort) {
        return new SendWeighInReminderUseCase(repository, pushNotificationPort);
    }
}
