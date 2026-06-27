package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeObjectiveCompletionRepository;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GetObjectiveCompletionsUseCaseTest {

    private FakeObjectiveCompletionRepository objectiveCompletionRepository;
    private GetObjectiveCompletionsUseCase getObjectiveCompletionsUseCase;

    @BeforeEach
    void setUp() {
        objectiveCompletionRepository = new FakeObjectiveCompletionRepository();
        getObjectiveCompletionsUseCase = new GetObjectiveCompletionsUseCase(objectiveCompletionRepository);
    }

    @Test
    void should_throw_when_from_date_is_after_to_date() {
        assertThatThrownBy(() -> getObjectiveCompletionsUseCase.execute(1L, LocalDate.of(2026, 6, 30), LocalDate.of(2026, 5, 1)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_return_completions_grouped_by_date_when_range_is_valid_and_completions_exist() {
        objectiveCompletionRepository.add(new ObjectiveCompletion(1L, 1L, 10L, LocalDate.of(2026, 6, 1)));

        Map<String, List<Long>> result = getObjectiveCompletionsUseCase.execute(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 30));

        assertThat(result).containsKey("2026-06-01");
        assertThat(result.get("2026-06-01")).containsExactly(10L);
    }

    @Test
    void should_throw_when_date_range_exceeds_365_days() {
        assertThatThrownBy(() -> getObjectiveCompletionsUseCase.execute(1L, LocalDate.of(2026, 1, 1), LocalDate.of(2027, 12, 31)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
