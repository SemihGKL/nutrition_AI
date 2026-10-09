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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

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
        useCase = useCaseAt(Clock.systemDefaultZone());
    }

    private CreateObjectiveUseCase useCaseAt(Clock clock) {
        return new CreateObjectiveUseCase(
                objectiveRepository,
                new GetDailyEntryUseCase(dailyEntryRepository),
                new CompleteObjectiveUseCase(objectiveRepository, completionRepository),
                clock);
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

    @Test
    void should_use_paris_date_when_server_clock_is_still_on_previous_utc_day() {
        // 22/06/2026 23:30 UTC = mardi 23/06/2026 01:30 à Paris.
        Clock clock = Clock.fixed(Instant.parse("2026-06-22T23:30:00Z"), ZoneId.of("Europe/Paris"));
        LocalDate parisTuesday = LocalDate.of(2026, 6, 23);
        dailyEntryRepository.save(new DailyEntry(null, USER_ID, parisTuesday, 1500, 0, 300, false));

        useCaseAt(clock).execute(new Objective(null, USER_ID, 1, "Séance sport", 0, "SPORT", null));

        assertThat(completionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getDate)
                .isEqualTo(parisTuesday);
    }

    @Test
    void should_complete_new_daily_sport_objective_automatically_when_a_session_is_already_recorded_today() {
        dailyEntryRepository.save(new DailyEntry(null, USER_ID, LocalDate.now(), 1500, 0, 300, false));

        useCase.execute(new Objective(null, USER_ID, -1, "Sport quotidien", 0, "SPORT", null));

        assertThat(completionRepository.getAll())
                .singleElement()
                .extracting(ObjectiveCompletion::getSource)
                .isEqualTo(CompletionSource.AUTO);
    }

    @Test
    void should_not_complete_new_sport_objective_when_no_session_is_recorded_today() {
        dailyEntryRepository.save(new DailyEntry(null, USER_ID, LocalDate.now(), 1500, 0, 0, false));

        useCase.execute(new Objective(null, USER_ID, -1, "Sport quotidien", 0, "SPORT", null));

        assertThat(completionRepository.getAll()).isEmpty();
    }
}
