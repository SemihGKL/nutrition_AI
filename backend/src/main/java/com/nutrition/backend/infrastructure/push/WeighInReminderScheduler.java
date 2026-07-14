package com.nutrition.backend.infrastructure.push;

import com.nutrition.backend.application.usecase.SendWeighInReminderUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

@Component
public class WeighInReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(WeighInReminderScheduler.class);
    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    private final SendWeighInReminderUseCase sendWeighInReminderUseCase;

    public WeighInReminderScheduler(SendWeighInReminderUseCase sendWeighInReminderUseCase) {
        this.sendWeighInReminderUseCase = sendWeighInReminderUseCase;
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "Europe/Paris")
    public void sendDailyWeighInReminders() {
        LocalDate today = LocalDate.now(PARIS);
        String dayOfWeek = today.getDayOfWeek().name();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        log.info("[PUSH] Déclenchement rappels pesée — jour={}, semaine depuis={}", dayOfWeek, weekStart);
        sendWeighInReminderUseCase.execute(dayOfWeek, weekStart.toString());
    }
}
