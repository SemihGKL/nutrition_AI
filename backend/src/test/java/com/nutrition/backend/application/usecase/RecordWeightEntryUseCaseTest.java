package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.application.usecase.fake.FakeWeightEntryRepository;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.model.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RecordWeightEntryUseCaseTest {

    private FakeWeightEntryRepository weightEntryRepository;
    private FakeUserRepository userRepository;
    private RecordWeightEntryUseCase recordWeightEntryUseCase;

    // « Aujourd'hui » à Paris pour ces tests : le 10 octobre 2026.
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 10);
    private static final Clock CLOCK = Clock.fixed(
            TODAY.atTime(9, 0).atZone(ZoneId.of("Europe/Paris")).toInstant(), ZoneId.of("Europe/Paris"));

    @BeforeEach
    void setUp() {
        weightEntryRepository = new FakeWeightEntryRepository();
        userRepository = new FakeUserRepository();
        recordWeightEntryUseCase = new RecordWeightEntryUseCase(weightEntryRepository, userRepository, CLOCK);
    }

    private User buildUser(Long id, double currentWeight) {
        return new User(id, "testuser", "user@example.com", "encoded_pass",
                Gender.MALE, 30, 175.0, 70.0, currentWeight, 1800, 65, "MONDAY", null);
    }

    @Test
    void should_save_weight_entry_and_return_it_when_recording_a_new_weight_measurement() {
        // Given
        WeightEntry entry = new WeightEntry(null, 1L, LocalDate.of(2024, 6, 1), 72.5, "Morning measurement");

        // When
        WeightEntry result = recordWeightEntryUseCase.execute(entry);

        // Then
        assertThat(result.getId()).isNotNull();
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getWeight()).isEqualTo(72.5);
        assertThat(result.getDate()).isEqualTo(LocalDate.of(2024, 6, 1));
        assertThat(result.getNote()).isEqualTo("Morning measurement");
    }

    @Test
    void should_update_user_current_weight_to_match_new_weight_entry_when_user_exists() {
        // Given
        User user = userRepository.save(buildUser(null, 70.0));
        double newWeight = 68.5;
        WeightEntry entry = new WeightEntry(null, user.getId(), LocalDate.of(2024, 6, 1), newWeight, null);

        // When
        recordWeightEntryUseCase.execute(entry);

        // Then
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getCurrentWeight()).isEqualTo(newWeight);
    }

    @Test
    void should_silently_ignore_user_weight_update_when_user_associated_with_weight_entry_does_not_exist() {
        // Given — no user in repository
        Long nonExistentUserId = 999L;
        WeightEntry entry = new WeightEntry(null, nonExistentUserId, LocalDate.of(2024, 6, 1), 72.0, null);

        // When — must not throw
        WeightEntry result = recordWeightEntryUseCase.execute(entry);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getWeight()).isEqualTo(72.0);
        assertThat(userRepository.findAll()).isEmpty();
    }

    // ── Dates des pesées ────────────────────────────────────────────────────

    private double currentWeightOf(User user) {
        return userRepository.findById(user.getId()).orElseThrow().getCurrentWeight();
    }

    @Test
    void should_keep_current_weight_when_recording_a_weigh_in_older_than_the_latest_one() {
        User user = userRepository.save(buildUser(null, 70.0));
        recordWeightEntryUseCase.execute(new WeightEntry(null, user.getId(), TODAY.minusDays(1), 78.0, null));

        recordWeightEntryUseCase.execute(new WeightEntry(null, user.getId(), TODAY.minusDays(20), 80.5, null));

        assertThat(currentWeightOf(user)).isEqualTo(78.0);
        assertThat(weightEntryRepository.findByUserIdOrderByDateDesc(user.getId())).hasSize(2);
    }

    @Test
    void should_update_current_weight_when_correcting_the_latest_weigh_in() {
        User user = userRepository.save(buildUser(null, 70.0));
        recordWeightEntryUseCase.execute(new WeightEntry(null, user.getId(), TODAY, 78.0, null));

        recordWeightEntryUseCase.execute(new WeightEntry(null, user.getId(), TODAY, 77.6, null));

        assertThat(currentWeightOf(user)).isEqualTo(77.6);
    }

    @Test
    void should_reject_a_weigh_in_dated_more_than_one_day_in_the_future() {
        User user = userRepository.save(buildUser(null, 70.0));

        assertThatThrownBy(() -> recordWeightEntryUseCase.execute(
                new WeightEntry(null, user.getId(), TODAY.plusDays(2), 75.0, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(weightEntryRepository.findByUserIdOrderByDateDesc(user.getId())).isEmpty();
        assertThat(currentWeightOf(user)).isEqualTo(70.0);
    }

    @Test
    void should_accept_a_weigh_in_dated_today_in_paris() {
        User user = userRepository.save(buildUser(null, 70.0));

        recordWeightEntryUseCase.execute(new WeightEntry(null, user.getId(), TODAY, 69.0, null));

        assertThat(currentWeightOf(user)).isEqualTo(69.0);
    }

    @Test
    void should_accept_tomorrow_for_a_user_whose_time_zone_is_ahead_of_paris() {
        User user = userRepository.save(buildUser(null, 70.0));

        recordWeightEntryUseCase.execute(new WeightEntry(null, user.getId(), TODAY.plusDays(1), 69.0, null));

        assertThat(currentWeightOf(user)).isEqualTo(69.0);
    }
}
