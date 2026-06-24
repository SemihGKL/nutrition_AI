package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeUserRepository;
import com.nutrition.backend.application.usecase.fake.FakeWeightEntryRepository;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.model.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class RecordWeightEntryUseCaseTest {

    private FakeWeightEntryRepository weightEntryRepository;
    private FakeUserRepository userRepository;
    private RecordWeightEntryUseCase recordWeightEntryUseCase;

    @BeforeEach
    void setUp() {
        weightEntryRepository = new FakeWeightEntryRepository();
        userRepository = new FakeUserRepository();
        recordWeightEntryUseCase = new RecordWeightEntryUseCase(weightEntryRepository, userRepository);
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
}
