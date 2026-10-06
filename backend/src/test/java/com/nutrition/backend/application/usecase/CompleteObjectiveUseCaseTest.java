package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeObjectiveCompletionRepository;
import com.nutrition.backend.application.usecase.fake.FakeObjectiveRepository;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.model.CompletionSource;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CompleteObjectiveUseCaseTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long OBJECTIVE_ID = 5L;
    private static final LocalDate DATE = LocalDate.of(2026, 6, 10);

    FakeObjectiveRepository objectiveRepository;
    FakeObjectiveCompletionRepository objectiveCompletionRepository;
    CompleteObjectiveUseCase useCase;

    @BeforeEach
    void setUp() {
        objectiveRepository = new FakeObjectiveRepository();
        objectiveCompletionRepository = new FakeObjectiveCompletionRepository();
        useCase = new CompleteObjectiveUseCase(objectiveRepository, objectiveCompletionRepository);
    }

    @Test
    void should_mark_objective_as_done_when_objective_belongs_to_the_requesting_user_and_no_completion_exists_for_that_date() {
        Objective objective = new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30);
        objectiveRepository.add(objective);

        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll())
                .hasSize(1)
                .allSatisfy(completion -> {
                    assertThat(completion.getObjectiveId()).isEqualTo(OBJECTIVE_ID);
                    assertThat(completion.getUserId()).isEqualTo(USER_ID);
                    assertThat(completion.getDate()).isEqualTo(DATE);
                });
    }

    @Test
    void should_not_create_duplicate_completion_when_objective_is_already_marked_done_for_that_date() {
        Objective objective = new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30);
        objectiveRepository.add(objective);

        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);
        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll()).hasSize(1);
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

    @Test
    void should_record_manual_completion_when_user_checks_objective() {
        objectiveRepository.add(new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30));

        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.MANUAL);
    }

    @Test
    void should_record_automatic_completion_when_completed_automatically() {
        objectiveRepository.add(new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30));

        useCase.executeAutomatic(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.AUTO);
    }

    @Test
    void should_turn_automatic_completion_into_manual_when_user_checks_it() {
        objectiveRepository.add(new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30));
        useCase.executeAutomatic(OBJECTIVE_ID, USER_ID, DATE);

        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.MANUAL);
    }

    @Test
    void should_keep_manual_completion_when_completed_automatically_afterwards() {
        objectiveRepository.add(new Objective(OBJECTIVE_ID, USER_ID, 3, "Running", 1, "SPORT", 30));
        useCase.execute(OBJECTIVE_ID, USER_ID, DATE);

        useCase.executeAutomatic(OBJECTIVE_ID, USER_ID, DATE);

        assertThat(objectiveCompletionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.MANUAL);
    }

    @Test
    void should_reject_automatic_completion_of_objective_owned_by_another_user() {
        objectiveRepository.add(new Objective(OBJECTIVE_ID, OTHER_USER_ID, 3, "Running", 1, "SPORT", 30));

        assertThatThrownBy(() -> useCase.executeAutomatic(OBJECTIVE_ID, USER_ID, DATE))
                .isInstanceOf(ObjectiveAccessDeniedException.class);
    }
}
