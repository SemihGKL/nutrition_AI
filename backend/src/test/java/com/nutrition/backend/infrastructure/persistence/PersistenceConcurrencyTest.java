package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.RefreshToken;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import com.nutrition.backend.domain.ports.RefreshTokenRepository;
import com.nutrition.backend.domain.ports.UserRepository;
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
