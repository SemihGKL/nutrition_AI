package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.ports.PushNotificationPort;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class SendWeighInReminderUseCase {

    private static final Logger log = LoggerFactory.getLogger(SendWeighInReminderUseCase.class);

    private static final String TITLE = "Rappel de pesée";
    private static final String BODY  = "C'est ton jour de pesée — pense à te peser ce matin !";

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushNotificationPort pushNotificationPort;

    public SendWeighInReminderUseCase(PushSubscriptionRepository pushSubscriptionRepository,
                                      PushNotificationPort pushNotificationPort) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.pushNotificationPort = pushNotificationPort;
    }

    public int execute(String dayOfWeek, String weekStartDate) {
        List<PushSubscription> subscriptions =
                pushSubscriptionRepository.findPendingWeighInReminders(dayOfWeek, weekStartDate);

        int sent = 0;
        for (PushSubscription sub : subscriptions) {
            try {
                pushNotificationPort.send(sub, TITLE, BODY);
                sent++;
            } catch (Exception e) {
                log.error("[PUSH] Échec envoi rappel pesée → endpoint={} : {}", sub.endpoint(), e.getMessage());
            }
        }
        log.info("[PUSH] Rappels pesée envoyés : {}/{} (jour={})", sent, subscriptions.size(), dayOfWeek);
        return sent;
    }
}
