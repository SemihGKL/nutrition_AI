package com.nutrition.backend.infrastructure.push;

import com.nutrition.backend.application.usecase.SendMealRemindersUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;

@Component
public class MealReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(MealReminderScheduler.class);

    private final SendMealRemindersUseCase sendMealRemindersUseCase;
    private final Clock clock;

    public MealReminderScheduler(SendMealRemindersUseCase sendMealRemindersUseCase, Clock clock) {
        this.sendMealRemindersUseCase = sendMealRemindersUseCase;
        this.clock = clock;
    }

    /** Chaque minute : les rappels réglés sur cette minute (heure de Paris, cf. bean Clock). */
    @Scheduled(cron = "0 * * * * *", zone = "Europe/Paris")
    public void sendDueMealReminders() {
        int sent = sendMealRemindersUseCase.execute(LocalDateTime.now(clock));
        if (sent > 0) log.info("[PUSH] Rappels repas envoyés : {}", sent);
    }
}
