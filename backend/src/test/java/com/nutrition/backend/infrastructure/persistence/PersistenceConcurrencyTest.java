package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.model.CompletionSource;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.Meals;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Tests d'intégration sur un vrai Postgres (Testcontainers). Skip proprement si
 * Docker est absent ; s'exécute en CI (ubuntu-latest a Docker).
 *
 * Couvre les comportements que les fakes en HashMap ne peuvent pas reproduire :
 *  - C3 : upsert atomique daily-kcal (idempotence + concurrence sans exception)
 *  - C4 : verrouillage optimiste sur users (lost updates)
 *  - M1 : rotation atomique du refresh token
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class PersistenceConcurrencyTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired DailyEntryRepository dailyEntryRepository;
    @Autowired UserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired ObjectiveRepository objectiveRepository;
    @Autowired ObjectiveCompletionRepository objectiveCompletionRepository;
    @Autowired WeightEntryRepository weightEntryRepository;

    private User newPersistedUser(String email) {
        return userRepository.save(new User(
                null, "user", email, "hash",
                Gender.MALE, 30, 178.0, 80.0, 80.0,
                2000, 75, "MONDAY", null));
    }

    // ── C3 : upsert daily-kcal ──────────────────────────────────────────────

    @Test
    void should_overwrite_existing_daily_entry_on_same_user_and_date() {
        User u = newPersistedUser("c3a@test.com");
        LocalDate date = LocalDate.of(2026, 6, 1);

        dailyEntryRepository.save(new DailyEntry(null, u.getId(), date, 2000, 5000, 100, false));
        dailyEntryRepository.save(new DailyEntry(null, u.getId(), date, 2200, 6000, 150, true));

        var found = dailyEntryRepository.findByUserIdAndDate(u.getId(), date);
        assertThat(found).isPresent();
        assertThat(found.get().getCaloriesConsumed()).isEqualTo(2200);
        assertThat(found.get().getSteps()).isEqualTo(6000);
        assertThat(found.get().isConfirmed()).isTrue();
        assertThat(dailyEntryRepository.findByUserId(u.getId())).hasSize(1);
    }

    @Test
    void should_not_throw_on_concurrent_writes_for_same_user_and_date() {
        User u = newPersistedUser("c3b@test.com");
        LocalDate date = LocalDate.of(2026, 6, 2);
        int n = 8;

        CompletableFuture<?>[] futures = new CompletableFuture[n];
        for (int i = 0; i < n; i++) {
            final int calories = 2000 + i;
            futures[i] = CompletableFuture.runAsync(() ->
                    dailyEntryRepository.save(new DailyEntry(null, u.getId(), date, calories, 5000, 100, false)));
        }

        assertThatCode(() -> CompletableFuture.allOf(futures).join()).doesNotThrowAnyException();
        assertThat(dailyEntryRepository.findByUserId(u.getId())).hasSize(1);
    }

    // ── Saisie par repas ────────────────────────────────────────────────────

    @Test
    void should_persist_meals_breakdown_and_summed_total_when_saving_entry_with_meals() {
        User u = newPersistedUser("meals-a@test.com");
        LocalDate date = LocalDate.of(2026, 9, 29);

        dailyEntryRepository.save(new DailyEntry(null, u.getId(), date, new Meals(400, 700, 150, 600), 0, 0, false));

        var found = dailyEntryRepository.findByUserIdAndDate(u.getId(), date);
        assertThat(found).isPresent();
        assertThat(found.get().getMeals()).isEqualTo(new Meals(400, 700, 150, 600));
        assertThat(found.get().getCaloriesConsumed()).isEqualTo(1850);
    }

    @Test
    void should_keep_direct_total_when_saving_legacy_entry_without_meals() {
        User u = newPersistedUser("meals-b@test.com");
        LocalDate date = LocalDate.of(2026, 9, 30);

        dailyEntryRepository.save(new DailyEntry(null, u.getId(), date, 1800, 0, 0, false));

        var found = dailyEntryRepository.findByUserIdAndDate(u.getId(), date);
        assertThat(found).isPresent();
        assertThat(found.get().getCaloriesConsumed()).isEqualTo(1800);
        assertThat(found.get().getMeals()).isEqualTo(Meals.none());
    }

    // ── P3 : complétion d'objectif idempotente ──────────────────────────────

    @Test
    void should_not_throw_on_concurrent_objective_completions_for_same_day() {
        User u = newPersistedUser("p3@test.com");
        Objective obj = objectiveRepository.save(new Objective(null, u.getId(), 0, "Sport", 0, "SPORT", null));
        LocalDate date = LocalDate.of(2026, 6, 3);
        int n = 8;

        CompletableFuture<?>[] futures = new CompletableFuture[n];
        for (int i = 0; i < n; i++) {
            futures[i] = CompletableFuture.runAsync(() ->
                    objectiveCompletionRepository.insertIfAbsent(
                            new ObjectiveCompletion(null, u.getId(), obj.getId(), date)));
        }

        assertThatCode(() -> CompletableFuture.allOf(futures).join()).doesNotThrowAnyException();
        assertThat(objectiveCompletionRepository.findByUserIdAndDateBetween(u.getId(), date, date)).hasSize(1);
    }

    @Test
    void should_turn_automatic_completion_into_manual_and_keep_it_on_auto_removal() {
        User u = newPersistedUser("source@test.com");
        Objective obj = objectiveRepository.save(new Objective(null, u.getId(), 0, "Sport", 0, "SPORT", null));
        LocalDate date = LocalDate.of(2026, 6, 4);

        objectiveCompletionRepository.insertIfAbsent(
                new ObjectiveCompletion(null, u.getId(), obj.getId(), date, CompletionSource.AUTO));
        objectiveCompletionRepository.insertIfAbsent(
                new ObjectiveCompletion(null, u.getId(), obj.getId(), date, CompletionSource.MANUAL));
        objectiveCompletionRepository.deleteAutomaticCompletion(obj.getId(), date);

        assertThat(objectiveCompletionRepository.findByUserIdAndDateBetween(u.getId(), date, date))
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.MANUAL);
    }

    @Test
    void should_delete_automatic_completion_only() {
        User u = newPersistedUser("source-auto@test.com");
        Objective obj = objectiveRepository.save(new Objective(null, u.getId(), 0, "Sport", 0, "SPORT", null));
        LocalDate date = LocalDate.of(2026, 6, 5);

        objectiveCompletionRepository.insertIfAbsent(
                new ObjectiveCompletion(null, u.getId(), obj.getId(), date, CompletionSource.AUTO));
        objectiveCompletionRepository.deleteAutomaticCompletion(obj.getId(), date);

        assertThat(objectiveCompletionRepository.findByUserIdAndDateBetween(u.getId(), date, date)).isEmpty();
    }

    // ── Rappels repas ───────────────────────────────────────────────────────

    @Autowired com.nutrition.backend.domain.ports.MealReminderRepository mealReminderRepository;

    @Test
    void should_upsert_meal_reminders_and_find_enabled_ones_at_a_given_time() {
        User u = newPersistedUser("meal-reminders@test.com");
        java.time.LocalTime noon = java.time.LocalTime.of(12, 30);

        mealReminderRepository.saveAll(u.getId(), java.util.List.of(
                new com.nutrition.backend.domain.entity.MealReminder(u.getId(), com.nutrition.backend.domain.model.MealType.LUNCH, java.time.LocalTime.of(12, 0), false)));
        mealReminderRepository.saveAll(u.getId(), java.util.List.of(
                new com.nutrition.backend.domain.entity.MealReminder(u.getId(), com.nutrition.backend.domain.model.MealType.LUNCH, noon, true)));

        assertThat(mealReminderRepository.findByUserId(u.getId())).hasSize(1);
        assertThat(mealReminderRepository.findEnabledAt(noon))
                .extracting(com.nutrition.backend.domain.entity.MealReminder::userId)
                .contains(u.getId());
    }

    // ── Email insensible à la casse ─────────────────────────────────────────

    @Test
    void should_find_user_by_email_whatever_the_case() {
        User u = newPersistedUser("Mixed.Case@Test.com");

        assertThat(userRepository.findByEmail("mixed.case@test.com")).map(User::getId).contains(u.getId());
    }

    @Test
    void should_prefer_exact_email_match_when_case_variants_exist() {
        newPersistedUser("dup@test.com");
        User exact = newPersistedUser("Dup@Test.com");

        assertThat(userRepository.findByEmail("Dup@Test.com")).map(User::getId).contains(exact.getId());
    }

    // ── Abonnements push : appareil partagé ─────────────────────────────────

    @Autowired com.nutrition.backend.domain.ports.PushSubscriptionRepository pushSubscriptionRepository;

    @Test
    void should_reassign_a_shared_device_to_the_last_subscribed_user() {
        User alice = newPersistedUser("push-alice@test.com");
        User bob = newPersistedUser("push-bob@test.com");
        var device = "https://push.example/device-shared";

        pushSubscriptionRepository.saveOrUpdate(new com.nutrition.backend.domain.entity.PushSubscription(null, alice.getId(), device, "k", "a"));
        pushSubscriptionRepository.saveOrUpdate(new com.nutrition.backend.domain.entity.PushSubscription(null, bob.getId(), device, "k2", "a2"));

        assertThat(pushSubscriptionRepository.findByUserId(alice.getId())).isEmpty();
        assertThat(pushSubscriptionRepository.findByUserId(bob.getId())).hasSize(1);

        pushSubscriptionRepository.deleteByEndpointForUser(device, alice.getId());
        assertThat(pushSubscriptionRepository.findByUserId(bob.getId())).hasSize(1);
        pushSubscriptionRepository.deleteByEndpointForUser(device, bob.getId());
        assertThat(pushSubscriptionRepository.findByUserId(bob.getId())).isEmpty();
    }

    // ── C4 : verrouillage optimiste sur users ───────────────────────────────

    @Test
    void should_reject_second_concurrent_update_of_same_user() {
        User u = newPersistedUser("c4@test.com");

        User loadedA = userRepository.findById(u.getId()).orElseThrow();
        User loadedB = userRepository.findById(u.getId()).orElseThrow();

        // Première écriture : OK (version 0 → 1)
        userRepository.save(loadedA.withCurrentWeight(82.0));

        // Seconde écriture basée sur la même version périmée → conflit optimiste
        assertThatThrownBy(() -> userRepository.save(loadedB.withCurrentWeight(90.0)))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);
    }

    // ── P4 : upsert des pesées ──────────────────────────────────────────────

    @Test
    void should_overwrite_weighin_on_same_user_and_date() {
        User u = newPersistedUser("p4@test.com");
        LocalDate date = LocalDate.of(2026, 6, 4);

        weightEntryRepository.save(new WeightEntry(null, u.getId(), date, 80.0, null));
        weightEntryRepository.save(new WeightEntry(null, u.getId(), date, 79.4, "corrigée"));

        var all = weightEntryRepository.findByUserIdOrderByDateDesc(u.getId());
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getWeight()).isEqualTo(79.4);
        assertThat(all.get(0).getNote()).isEqualTo("corrigée");
    }

    // ── M1 : rotation atomique du refresh token ─────────────────────────────

    @Test
    void should_replace_all_user_tokens_atomically() {
        User u = newPersistedUser("m1@test.com");
        Instant future = Instant.now().plus(7, ChronoUnit.DAYS);
        refreshTokenRepository.save(new RefreshToken(null, u.getId(), "old-token", future));

        refreshTokenRepository.replaceUserTokens(u.getId(), new RefreshToken(null, u.getId(), "new-token", future));

        assertThat(refreshTokenRepository.findByToken("old-token")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("new-token")).isPresent();
    }
}
