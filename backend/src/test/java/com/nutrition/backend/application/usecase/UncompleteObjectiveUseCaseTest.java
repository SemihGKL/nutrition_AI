package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeObjectiveCompletionRepository;
import com.nutrition.backend.application.usecase.fake.FakeObjectiveRepository;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UncompleteObjectiveUseCaseTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long OBJECTIVE_ID = 5L;
    private static final LocalDate DATE = LocalDate.of(2026, 6, 10);

    FakeObjectiveRepository objectiveRepository;
    FakeObjectiveCompletionRepository objectiveCompletionRepository;
    UncompleteObjectiveUseCase useCase;

    @BeforeEach
    void setUp() {
        objectiveRepository = new FakeObjectiveRepository();
        objectiveCompletionRepository = new FakeObjectiveCompletionRepository();
        useCase = new UncompleteObjectiveUseCase(objectiveRepository, objectiveCompletionRepository);
    }

    @Test
    void should_remove_completion_when_objective_belongs_to_the_requesting_user_and_completion_exists() {
        Objective objective = new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30);
        objectiveRepository.add(objective);
        objectiveCompletionRepository.add(new ObjectiveCompletion(1L, USER_ID, OBJECTIVE_ID, DATE));

        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll()).isEmpty();
    }

    @Test
    void should_throw_objective_not_found_when_objective_does_not_exist() {
        assertThatThrownBy(() -> useCase.execute(99L, USER_ID, DATE))
                .isInstanceOf(ObjectiveNotFoundException.class);
    }

    @Test
    void should_throw_access_denied_when_objective_belongs_to_a_different_user() {
        Objective objective = new Objective(OBJECTIVE_ID, OTHER_USER_ID, 3, "Running", 1, "SPORT", 30);
        objectiveRepository.add(objective);

        assertThatThrownBy(() -> useCase.execute(OBJECTIVE_ID, USER_ID, DATE))
                .isInstanceOf(ObjectiveAccessDeniedException.class);
    }
}
