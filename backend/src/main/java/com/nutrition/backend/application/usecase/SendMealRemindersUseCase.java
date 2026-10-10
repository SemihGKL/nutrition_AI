package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.exception.PushSubscriptionExpiredException;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import com.nutrition.backend.domain.ports.MealReminderRepository;
import com.nutrition.backend.domain.ports.PushNotificationPort;
import com.nutrition.backend.domain.ports.PushSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

@Component
public class SendMealRemindersUseCase {

    private static final Logger log = LoggerFactory.getLogger(SendMealRemindersUseCase.class);
    private static final String BODY = "C'est l'heure de ce repas — pense à le noter dans Kaloriim.";
    /** Fenêtre de rattrapage : un rappel manqué (serveur redémarré) part encore jusqu'à 10 min après. */
    static final Duration CATCH_UP = Duration.ofMinutes(10);

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
     * Envoie les rappels prévus dans les {@link #CATCH_UP} dernières minutes (heure de Paris)
     * et pas encore envoyés aujourd'hui : un redémarrage du serveur (déploiement) ne fait
     * plus perdre le rappel de la minute concernée. Un repas déjà renseigné n'est pas
     * rappelé. Retourne le nombre de notifications envoyées.
     */
    public int execute(LocalDateTime now) {
        LocalDateTime current = now.truncatedTo(ChronoUnit.MINUTES);
        LocalDate today = current.toLocalDate();
        LocalDateTime windowStart = current.minus(CATCH_UP).plusMinutes(1);
        // On ne remonte pas avant minuit : un rappel de la veille n'a plus de sens.
        LocalTime from = windowStart.toLocalDate().isBefore(today) ? LocalTime.MIDNIGHT : windowStart.toLocalTime();

        int sent = 0;
        for (MealReminder reminder : mealReminderRepository.findDueBetween(from, current.toLocalTime(), today)) {
            if (isAlreadyFilled(reminder, today)) {
                mealReminderRepository.markSent(reminder.userId(), reminder.meal(), today);
                continue;
            }
            Delivery delivery = deliver(reminder);
            sent += delivery.delivered();
            // Échec temporaire sans aucun envoi réussi : on retente à la minute suivante.
            if (delivery.delivered() > 0 || !delivery.temporaryFailure()) {
                mealReminderRepository.markSent(reminder.userId(), reminder.meal(), today);
            }
        }
        return sent;
    }

    private record Delivery(int delivered, boolean temporaryFailure) {}

    private Delivery deliver(MealReminder reminder) {
        int delivered = 0;
        boolean temporaryFailure = false;
        for (PushSubscription sub : pushSubscriptionRepository.findByUserId(reminder.userId())) {
            try {
                pushNotificationPort.send(sub, reminder.meal().label(), BODY);
                delivered++;
            } catch (PushSubscriptionExpiredException e) {
                pushSubscriptionRepository.deleteByEndpointForUser(sub.endpoint(), sub.userId());
            } catch (Exception e) {
                temporaryFailure = true;
                log.error("[PUSH] Échec rappel repas {} → endpoint={} : {}", reminder.meal(), sub.endpoint(), e.getMessage());
            }
        }
        return new Delivery(delivered, temporaryFailure);
    }

    private boolean isAlreadyFilled(MealReminder reminder, LocalDate today) {
        return dailyEntryRepository.findByUserIdAndDate(reminder.userId(), today)
                .map(DailyEntry::getMeals)
                .map(meals -> meals.kcalFor(reminder.meal()) > 0)
                .orElse(false);
    }
}
