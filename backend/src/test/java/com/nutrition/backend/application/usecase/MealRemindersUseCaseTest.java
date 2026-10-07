package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeDailyEntryRepository;
import com.nutrition.backend.application.usecase.fake.FakeMealReminderRepository;
import com.nutrition.backend.application.usecase.fake.FakePushSubscriptionRepository;
import com.nutrition.backend.application.usecase.fake.SpyPushNotificationPort;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.model.MealType;
import com.nutrition.backend.domain.model.Meals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MealRemindersUseCaseTest {

    private static final Long USER = 1L;
    private static final Long OTHER = 2L;
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 7);
    private static final LocalTime NOON_THIRTY = LocalTime.of(12, 30);

    private FakeMealReminderRepository reminderRepository;
    private FakePushSubscriptionRepository subscriptionRepository;
    private FakeDailyEntryRepository dailyEntryRepository;
    private SpyPushNotificationPort pushPort;

    private GetMealRemindersUseCase getUseCase;
    private UpdateMealRemindersUseCase updateUseCase;
    private SendMealRemindersUseCase sendUseCase;

    @BeforeEach
    void setUp() {
        reminderRepository = new FakeMealReminderRepository();
        subscriptionRepository = new FakePushSubscriptionRepository();
        dailyEntryRepository = new FakeDailyEntryRepository();
        pushPort = new SpyPushNotificationPort();
        getUseCase = new GetMealRemindersUseCase(reminderRepository);
        updateUseCase = new UpdateMealRemindersUseCase(reminderRepository);
        sendUseCase = new SendMealRemindersUseCase(reminderRepository, subscriptionRepository,
                dailyEntryRepository, pushPort);
    }

    private void subscribe(Long userId, String endpoint) {
        subscriptionRepository.saveOrUpdate(new PushSubscription(null, userId, endpoint, "p256dh", "auth"));
    }

    private void remind(Long userId, MealType meal, LocalTime time, boolean enabled) {
        reminderRepository.saveAll(userId, List.of(new MealReminder(userId, meal, time, enabled)));
    }

    // ── Réglages ────────────────────────────────────────────────────────────

    @Test
    void should_return_the_four_meals_disabled_at_usual_times_when_nothing_is_configured() {
        List<MealReminder> reminders = getUseCase.execute(USER);

        assertThat(reminders).extracting(MealReminder::meal)
                .containsExactly(MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER);
        assertThat(reminders).allMatch(r -> !r.enabled());
        assertThat(reminders).extracting(MealReminder::time)
                .containsExactly(LocalTime.of(8, 0), LocalTime.of(12, 30), LocalTime.of(16, 30), LocalTime.of(19, 30));
    }

    @Test
    void should_return_configured_reminder_and_defaults_for_the_other_meals() {
        remind(USER, MealType.LUNCH, LocalTime.of(13, 0), true);

        List<MealReminder> reminders = getUseCase.execute(USER);

        assertThat(reminders).hasSize(4);
        assertThat(reminders.get(1)).isEqualTo(new MealReminder(USER, MealType.LUNCH, LocalTime.of(13, 0), true));
        assertThat(reminders.get(0).enabled()).isFalse();
    }

    @Test
    void should_save_reminders_and_return_the_full_configuration() {
        List<MealReminder> result = updateUseCase.execute(USER, List.of(
                new MealReminder(USER, MealType.BREAKFAST, LocalTime.of(7, 15), true),
                new MealReminder(USER, MealType.DINNER, LocalTime.of(20, 0), true)));

        assertThat(result).hasSize(4);
        assertThat(result.get(0)).isEqualTo(new MealReminder(USER, MealType.BREAKFAST, LocalTime.of(7, 15), true));
        assertThat(result.get(3)).isEqualTo(new MealReminder(USER, MealType.DINNER, LocalTime.of(20, 0), true));
    }

    @Test
    void should_replace_previous_setting_of_the_same_meal() {
        updateUseCase.execute(USER, List.of(new MealReminder(USER, MealType.LUNCH, LocalTime.of(12, 0), true)));

        updateUseCase.execute(USER, List.of(new MealReminder(USER, MealType.LUNCH, LocalTime.of(12, 45), false)));

        assertThat(getUseCase.execute(USER).get(1))
                .isEqualTo(new MealReminder(USER, MealType.LUNCH, LocalTime.of(12, 45), false));
    }

    @Test
    void should_store_reminders_for_the_requesting_user_only() {
        updateUseCase.execute(USER, List.of(new MealReminder(OTHER, MealType.LUNCH, LocalTime.of(12, 0), true)));

        assertThat(getUseCase.execute(USER).get(1).enabled()).isTrue();
        assertThat(getUseCase.execute(OTHER).get(1).enabled()).isFalse();
    }

    // ── Envoi ───────────────────────────────────────────────────────────────

    @Test
    void should_notify_every_device_of_the_user_at_the_reminder_time_when_meal_is_not_filled() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, true);
        subscribe(USER, "phone");
        subscribe(USER, "laptop");

        int sent = sendUseCase.execute(TODAY.atTime(NOON_THIRTY));

        assertThat(sent).isEqualTo(2);
        assertThat(pushPort.sent()).extracting(SpyPushNotificationPort.Sent::endpoint)
                .containsExactlyInAnyOrder("phone", "laptop");
        assertThat(pushPort.sent().get(0).title()).isEqualTo("Déjeuner");
    }

    @Test
    void should_ignore_seconds_of_the_current_time() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, true);
        subscribe(USER, "phone");

        assertThat(sendUseCase.execute(LocalDateTime.of(TODAY, LocalTime.of(12, 30, 42)))).isEqualTo(1);
    }

    @Test
    void should_not_notify_when_the_meal_is_already_filled_today() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, true);
        subscribe(USER, "phone");
        dailyEntryRepository.save(new DailyEntry(null, USER, TODAY, new Meals(0, 650, 0, 0), 0, 0, false));

        assertThat(sendUseCase.execute(TODAY.atTime(NOON_THIRTY))).isZero();
        assertThat(pushPort.sent()).isEmpty();
    }

    @Test
    void should_notify_when_another_meal_is_filled_but_not_this_one() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, true);
        subscribe(USER, "phone");
        dailyEntryRepository.save(new DailyEntry(null, USER, TODAY, new Meals(400, 0, 0, 0), 0, 0, false));

        assertThat(sendUseCase.execute(TODAY.atTime(NOON_THIRTY))).isEqualTo(1);
    }

    @Test
    void should_not_notify_for_a_disabled_reminder_or_another_time() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, false);
        remind(USER, MealType.DINNER, LocalTime.of(19, 30), true);
        subscribe(USER, "phone");

        assertThat(sendUseCase.execute(TODAY.atTime(NOON_THIRTY))).isZero();
    }

    @Test
    void should_not_notify_a_user_without_push_subscription() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, true);

        assertThat(sendUseCase.execute(TODAY.atTime(NOON_THIRTY))).isZero();
    }

    @Test
    void should_keep_notifying_other_devices_when_one_push_fails() {
        remind(USER, MealType.LUNCH, NOON_THIRTY, true);
        subscribe(USER, "broken");
        subscribe(USER, "phone");
        pushPort.failFor("broken");

        assertThat(sendUseCase.execute(TODAY.atTime(NOON_THIRTY))).isEqualTo(1);
        assertThat(pushPort.sent()).extracting(SpyPushNotificationPort.Sent::endpoint).containsExactly("phone");
    }
}
