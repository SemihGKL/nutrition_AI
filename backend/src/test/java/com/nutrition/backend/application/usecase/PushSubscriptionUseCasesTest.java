package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakePushSubscriptionRepository;
import com.nutrition.backend.domain.entity.PushSubscription;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PushSubscriptionUseCasesTest {

    private static final Long ALICE = 1L;
    private static final Long BOB = 2L;

    private FakePushSubscriptionRepository repository;
    private SavePushSubscriptionUseCase save;
    private DeletePushSubscriptionUseCase delete;

    @BeforeEach
    void setUp() {
        repository = new FakePushSubscriptionRepository();
        save = new SavePushSubscriptionUseCase(repository);
        delete = new DeletePushSubscriptionUseCase(repository);
    }

    @Test
    void should_attach_a_shared_device_to_the_user_who_subscribes_last() {
        save.execute(ALICE, "device-1", "p256dh", "auth");

        save.execute(BOB, "device-1", "p256dh", "auth");

        assertThat(repository.findByUserId(BOB)).extracting(PushSubscription::endpoint).containsExactly("device-1");
        assertThat(repository.findByUserId(ALICE)).isEmpty();
    }

    @Test
    void should_detach_the_device_of_the_requesting_user() {
        save.execute(ALICE, "device-1", "p256dh", "auth");

        delete.execute(ALICE, "device-1");

        assertThat(repository.findByUserId(ALICE)).isEmpty();
    }

    @Test
    void should_not_detach_a_device_belonging_to_another_user() {
        save.execute(BOB, "device-1", "p256dh", "auth");

        delete.execute(ALICE, "device-1");

        assertThat(repository.findByUserId(BOB)).extracting(PushSubscription::endpoint).containsExactly("device-1");
    }
}
