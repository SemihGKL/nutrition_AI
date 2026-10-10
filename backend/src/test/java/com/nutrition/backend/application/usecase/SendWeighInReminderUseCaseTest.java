package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePushSubscriptionRepository;
import com.nutrition.backend.application.usecase.fake.SpyPushNotificationPort;
import com.nutrition.backend.domain.entity.PushSubscription;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SendWeighInReminderUseCaseTest {

    private FakePushSubscriptionRepository repository;
    private SpyPushNotificationPort pushPort;
    private SendWeighInReminderUseCase useCase;

    @BeforeEach
    void setUp() {
        repository = new FakePushSubscriptionRepository();
        pushPort = new SpyPushNotificationPort();
        useCase = new SendWeighInReminderUseCase(repository, pushPort);
    }

    private static PushSubscription device(Long userId, String endpoint) {
        return new PushSubscription(null, userId, endpoint, "p256dh", "auth");
    }

    @Test
    void should_send_the_reminder_to_every_pending_device() {
        repository.givenPendingWeighInReminders(List.of(device(1L, "phone"), device(2L, "laptop")));

        assertThat(useCase.execute("MONDAY", "2026-10-05")).isEqualTo(2);
        assertThat(pushPort.sent()).extracting(SpyPushNotificationPort.Sent::title).containsOnly("Rappel de pesée");
    }

    @Test
    void should_remove_an_uninstalled_device_and_not_count_it_as_sent() {
        repository.givenPendingWeighInReminders(List.of(device(1L, "uninstalled"), device(1L, "phone")));
        pushPort.expireFor("uninstalled");

        assertThat(useCase.execute("MONDAY", "2026-10-05")).isEqualTo(1);
        assertThat(repository.findByUserId(1L)).extracting(PushSubscription::endpoint).containsExactly("phone");
    }

    @Test
    void should_keep_a_device_after_a_temporary_failure() {
        repository.givenPendingWeighInReminders(List.of(device(1L, "flaky")));
        pushPort.failFor("flaky");

        assertThat(useCase.execute("MONDAY", "2026-10-05")).isZero();
        assertThat(repository.findByUserId(1L)).hasSize(1);
    }
}
