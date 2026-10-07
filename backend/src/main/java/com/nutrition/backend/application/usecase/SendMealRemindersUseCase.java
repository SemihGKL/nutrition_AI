package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import com.nutrition.backend.domain.ports.MealReminderRepository;
import com.nutrition.backend.domain.ports.PushNotificationPort;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class SendMealRemindersUseCase {

    private static final Logger log = LoggerFactory.getLogger(SendMealRemindersUseCase.class);
    private static final String BODY = "C'est l'heure de ce repas — pense à le noter dans Kaloriim.";

    private final MealReminderRepository mealReminderRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final DailyEntryRepository dailyEntryRepository;
    private final PushNotificationPort pushNotificationPort;

    public SendMealRemindersUseCase(MealReminderRepository mealReminderRepository,
                                    PushSubscriptionRepository pushSubscriptionRepository,
                                    DailyEntryRepository dailyEntryRepository,
                                    PushNotificationPort pushNotificationPort) {
        this.mealReminderRepository = mealReminderRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.dailyEntryRepository = dailyEntryRepository;
        this.pushNotificationPort = pushNotificationPort;
    }

    /**
     * Envoie les rappels réglés sur la minute courante (heure de Paris), sauf si le repas
     * est déjà renseigné ce jour-là. Retourne le nombre de notifications envoyées.
     */
    public int execute(LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        int sent = 0;
        for (MealReminder reminder : mealReminderRepository.findEnabledAt(now.toLocalTime().truncatedTo(ChronoUnit.MINUTES))) {
            if (isAlreadyFilled(reminder, today)) continue;
            for (PushSubscription sub : pushSubscriptionRepository.findByUserId(reminder.userId())) {
                try {
                    pushNotificationPort.send(sub, reminder.meal().label(), BODY);
                    sent++;
                } catch (Exception e) {
                    log.error("[PUSH] Échec rappel repas {} → endpoint={} : {}", reminder.meal(), sub.endpoint(), e.getMessage());
                }
            }
        }
        return sent;
    }

    private boolean isAlreadyFilled(MealReminder reminder, LocalDate today) {
        return dailyEntryRepository.findByUserIdAndDate(reminder.userId(), today)
                .map(DailyEntry::getMeals)
                .map(meals -> meals.kcalFor(reminder.meal()) > 0)
                .orElse(false);
    }
}
