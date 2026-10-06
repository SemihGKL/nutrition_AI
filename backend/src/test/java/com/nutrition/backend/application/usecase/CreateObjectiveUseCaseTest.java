package com.nutrition.backend.application.usecase;

import com.nutrition.backend.application.usecase.fake.FakeDailyEntryRepository;
import com.nutrition.backend.application.usecase.fake.FakeObjectiveCompletionRepository;
import com.nutrition.backend.application.usecase.fake.FakeObjectiveRepository;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.model.CompletionSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CreateObjectiveUseCaseTest {

    private static final Long USER_ID = 1L;

    private FakeObjectiveRepository objectiveRepository;
    private FakeObjectiveCompletionRepository completionRepository;
    private FakeDailyEntryRepository dailyEntryRepository;
    private CreateObjectiveUseCase useCase;

    @BeforeEach
    void setUp() {
        objectiveRepository = new FakeObjectiveRepository();
        completionRepository = new FakeObjectiveCompletionRepository();
        dailyEntryRepository = new FakeDailyEntryRepository();
        useCase = new CreateObjectiveUseCase(
                objectiveRepository,
                new GetDailyEntryUseCase(dailyEntryRepository),
                new CompleteObjectiveUseCase(objectiveRepository, completionRepository));
    }

    @Test
    void should_complete_new_sport_objective_automatically_when_a_session_is_already_recorded_today() {
        LocalDate today = LocalDate.now();
        int todayDow = today.getDayOfWeek().getValue() - 1;
        dailyEntryRepository.save(new DailyEntry(null, USER_ID, today, 1500, 0, 300, false));

        useCase.execute(new Objective(null, USER_ID, todayDow, "Séance sport", 0, "SPORT", null));

        assertThat(completionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.AUTO);
    }
}
