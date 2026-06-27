package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeObjectiveCompletionRepository;
import com.nutrition.backend.application.usecase.fake.FakeObjectiveRepository;
import com.nutrition.backend.domain.entity.Objective;
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
        useCase = new AutoCompleteObjectivesUseCase(objectiveRepository, completeObjectiveUseCase);
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
}
