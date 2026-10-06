package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeObjectiveCompletionRepository;
import com.nutrition.backend.application.usecase.fake.FakeObjectiveRepository;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.model.CompletionSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class AutoCompleteObjectivesUseCaseTest {

    private static final Long USER_ID = 1L;

    private FakeObjectiveRepository objectiveRepository;
    private FakeObjectiveCompletionRepository completionRepository;
    private CompleteObjectiveUseCase completeObjectiveUseCase;
    private AutoCompleteObjectivesUseCase useCase;

    @BeforeEach
    void setUp() {
        objectiveRepository = new FakeObjectiveRepository();
        completionRepository = new FakeObjectiveCompletionRepository();
        completeObjectiveUseCase = new CompleteObjectiveUseCase(objectiveRepository, completionRepository);
        useCase = new AutoCompleteObjectivesUseCase(objectiveRepository, completeObjectiveUseCase, completionRepository);
    }

    @Test
    void should_complete_sport_objective_automatically_when_calories_burned_is_positive_and_day_of_week_matches() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1; // 0

        Objective sportObj = new Objective(10L, USER_ID, dow, "Séance sport lundi", 0, "SPORT", null);
        objectiveRepository.add(sportObj);

        useCase.execute(USER_ID, monday, 300);

        assertThat(completionRepository.existsByObjectiveIdAndDate(10L, monday)).isTrue();
    }

    @Test
    void should_not_complete_sport_objective_when_calories_burned_is_zero() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1;

        Objective sportObj = new Objective(10L, USER_ID, dow, "Séance sport lundi", 0, "SPORT", null);
        objectiveRepository.add(sportObj);

        useCase.execute(USER_ID, monday, 0);

        assertThat(completionRepository.getAll()).isEmpty();
    }

    @Test
    void should_not_complete_objective_when_type_is_not_sport() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1;

        Objective customObj = new Objective(20L, USER_ID, dow, "Boire 2L d'eau", 0, "CUSTOM", null);
        objectiveRepository.add(customObj);

        useCase.execute(USER_ID, monday, 300);

        assertThat(completionRepository.getAll()).isEmpty();
    }

    @Test
    void should_not_complete_sport_objective_when_day_of_week_does_not_match_the_stored_objective_day() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        LocalDate tuesday = LocalDate.of(2026, 6, 23);

        Objective sportObj = new Objective(10L, USER_ID, monday.getDayOfWeek().getValue() - 1, "Séance sport lundi", 0, "SPORT", null);
        objectiveRepository.add(sportObj);

        useCase.execute(USER_ID, tuesday, 300);

        assertThat(completionRepository.getAll()).isEmpty();
    }

    @Test
    void should_complete_daily_sport_objective_automatically_when_day_of_week_is_minus_one_and_calories_burned_is_positive() {
        LocalDate wednesday = LocalDate.of(2026, 6, 24);

        Objective dailySportObj = new Objective(30L, USER_ID, -1, "Sport quotidien", 0, "SPORT", null);
        objectiveRepository.add(dailySportObj);

        useCase.execute(USER_ID, wednesday, 200);

        assertThat(completionRepository.existsByObjectiveIdAndDate(30L, wednesday)).isTrue();
    }

    // ── Origine de la coche : seules les coches automatiques sont retirées ──

    private static final LocalDate MONDAY = LocalDate.of(2026, 6, 22);
    private static final Long SPORT_ID = 10L;

    private void givenMondaySportObjective() {
        objectiveRepository.add(new Objective(SPORT_ID, USER_ID, 0, "Séance sport lundi", 0, "SPORT", null));
    }

    @Test
    void should_mark_completion_as_automatic_when_sport_objective_is_auto_completed() {
        givenMondaySportObjective();

        useCase.execute(USER_ID, MONDAY, 300);

        assertThat(completionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.AUTO);
    }

    @Test
    void should_remove_automatic_completion_when_calories_burned_goes_back_to_zero() {
        givenMondaySportObjective();
        useCase.execute(USER_ID, MONDAY, 300);

        useCase.execute(USER_ID, MONDAY, 0);

        assertThat(completionRepository.existsByObjectiveIdAndDate(SPORT_ID, MONDAY)).isFalse();
    }

    @Test
    void should_keep_manual_completion_when_calories_burned_is_zero() {
        givenMondaySportObjective();
        completionRepository.add(new ObjectiveCompletion(1L, USER_ID, SPORT_ID, MONDAY, CompletionSource.MANUAL));

        useCase.execute(USER_ID, MONDAY, 0);

        assertThat(completionRepository.existsByObjectiveIdAndDate(SPORT_ID, MONDAY)).isTrue();
    }

    @Test
    void should_keep_manual_completion_manual_when_session_is_recorded_then_cleared() {
        givenMondaySportObjective();
        completionRepository.add(new ObjectiveCompletion(1L, USER_ID, SPORT_ID, MONDAY, CompletionSource.MANUAL));

        useCase.execute(USER_ID, MONDAY, 300);
        useCase.execute(USER_ID, MONDAY, 0);

        assertThat(completionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.MANUAL);
    }

    @Test
    void should_only_remove_automatic_completion_of_the_cleared_day() {
        givenMondaySportObjective();
        LocalDate nextMonday = MONDAY.plusWeeks(1);
        useCase.execute(USER_ID, MONDAY, 300);
        useCase.execute(USER_ID, nextMonday, 300);

        useCase.execute(USER_ID, nextMonday, 0);

        assertThat(completionRepository.existsByObjectiveIdAndDate(SPORT_ID, MONDAY)).isTrue();
        assertThat(completionRepository.existsByObjectiveIdAndDate(SPORT_ID, nextMonday)).isFalse();
    }

    @Test
    void should_complete_again_automatically_when_session_is_cleared_then_recorded_again() {
        givenMondaySportObjective();
        useCase.execute(USER_ID, MONDAY, 300);
        useCase.execute(USER_ID, MONDAY, 0);

        useCase.execute(USER_ID, MONDAY, 250);

        assertThat(completionRepository.existsByObjectiveIdAndDate(SPORT_ID, MONDAY)).isTrue();
    }

    @Test
    void should_not_remove_completion_of_custom_objective_when_calories_burned_is_zero() {
        objectiveRepository.add(new Objective(20L, USER_ID, 0, "Boire 2L d'eau", 0, "CUSTOM", null));
        completionRepository.add(new ObjectiveCompletion(1L, USER_ID, 20L, MONDAY, CompletionSource.AUTO));

        useCase.execute(USER_ID, MONDAY, 0);

        assertThat(completionRepository.existsByObjectiveIdAndDate(20L, MONDAY)).isTrue();
    }
}
