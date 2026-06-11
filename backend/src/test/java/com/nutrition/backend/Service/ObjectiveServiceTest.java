package com.nutrition.backend.Service;

import com.nutrition.backend.Class.ObjectiveCompletion;
import com.nutrition.backend.Class.UserObjective;
import com.nutrition.backend.Repository.ObjectiveCompletionRepository;
import com.nutrition.backend.Repository.UserObjectiveRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObjectiveServiceTest {

    @Mock
    private UserObjectiveRepository userObjectiveRepository;

    @Mock
    private ObjectiveCompletionRepository objectiveCompletionRepository;

    @InjectMocks
    private ObjectiveService objectiveService;

    @Test
    void should_return_empty_list_when_user_has_no_objectives() {
        when(userObjectiveRepository.findByUserId(1L)).thenReturn(List.of());

        List<UserObjective> result = objectiveService.getObjectives(1L);

        assertThat(result).isEmpty();
    }

    @Test
    void should_return_all_objectives_when_user_has_objectives() {
        UserObjective obj1 = new UserObjective();
        obj1.setId(1L);
        obj1.setUserId(1L);
        obj1.setDayOfWeek(1);
        obj1.setLabel("Boire 2L d'eau");

        UserObjective obj2 = new UserObjective();
        obj2.setId(2L);
        obj2.setUserId(1L);
        obj2.setDayOfWeek(3);
        obj2.setLabel("30 min de sport");

        when(userObjectiveRepository.findByUserId(1L)).thenReturn(List.of(obj1, obj2));

        List<UserObjective> result = objectiveService.getObjectives(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getLabel()).isEqualTo("Boire 2L d'eau");
        assertThat(result.get(1).getLabel()).isEqualTo("30 min de sport");
    }

    @Test
    void should_create_objective_and_return_it_when_day_of_week_and_label_are_valid() {
        UserObjective toSave = new UserObjective();
        toSave.setUserId(1L);
        toSave.setDayOfWeek(2);
        toSave.setLabel("Méditer 10 min");

        UserObjective saved = new UserObjective();
        saved.setId(10L);
        saved.setUserId(1L);
        saved.setDayOfWeek(2);
        saved.setLabel("Méditer 10 min");

        when(userObjectiveRepository.save(toSave)).thenReturn(saved);

        UserObjective result = objectiveService.createObjective(toSave);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getLabel()).isEqualTo("Méditer 10 min");
        verify(userObjectiveRepository).save(toSave);
    }

    @Test
    void should_delete_objective_when_objective_belongs_to_the_authenticated_user() {
        UserObjective objective = new UserObjective();
        objective.setId(5L);
        objective.setUserId(1L);
        objective.setLabel("Lire 20 pages");

        when(userObjectiveRepository.findById(5L)).thenReturn(Optional.of(objective));

        objectiveService.deleteObjective(5L, 1L);

        verify(userObjectiveRepository).deleteById(5L);
    }

    @Test
    void should_prevent_deletion_when_objective_does_not_belong_to_the_authenticated_user() {
        UserObjective objective = new UserObjective();
        objective.setId(5L);
        objective.setUserId(2L);
        objective.setLabel("Lire 20 pages");

        when(userObjectiveRepository.findById(5L)).thenReturn(Optional.of(objective));

        assertThatThrownBy(() -> objectiveService.deleteObjective(5L, 1L))
                .isInstanceOf(com.nutrition.backend.Exception.ObjectiveAccessDeniedException.class);

        verify(userObjectiveRepository, never()).deleteById(anyLong());
    }

    @Test
    void should_prevent_deletion_when_objective_does_not_exist() {
        when(userObjectiveRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> objectiveService.deleteObjective(99L, 1L))
                .isInstanceOf(com.nutrition.backend.Exception.ObjectiveNotFoundException.class);

        verify(userObjectiveRepository, never()).deleteById(anyLong());
    }

    @Test
    void should_mark_objective_as_done_when_no_completion_exists_for_that_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        when(objectiveCompletionRepository.existsByObjectiveIdAndDate(5L, date)).thenReturn(false);

        objectiveService.markDone(5L, 1L, date);

        verify(objectiveCompletionRepository).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_not_create_duplicate_completion_when_objective_is_already_marked_done_for_that_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        when(objectiveCompletionRepository.existsByObjectiveIdAndDate(5L, date)).thenReturn(true);

        objectiveService.markDone(5L, 1L, date);

        verify(objectiveCompletionRepository, never()).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_remove_completion_when_objective_is_marked_undone_for_a_date() {
        LocalDate date = LocalDate.of(2026, 6, 10);

        objectiveService.markUndone(5L, 1L, date);

        verify(objectiveCompletionRepository).deleteByObjectiveIdAndDate(5L, date);
    }

    @Test
    void should_return_empty_map_when_no_completions_exist_in_date_range() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 7);
        when(objectiveCompletionRepository.findByUserIdAndDateBetween(1L, from, to)).thenReturn(List.of());

        Map<String, List<Long>> result = objectiveService.getCompletions(1L, from, to);

        assertThat(result).isEmpty();
    }

    @Test
    void should_return_completions_map_indexed_by_date_when_completions_exist_in_date_range() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 7);

        ObjectiveCompletion c1 = new ObjectiveCompletion();
        c1.setId(1L);
        c1.setUserId(1L);
        c1.setObjectiveId(10L);
        c1.setDate(LocalDate.of(2026, 6, 3));

        ObjectiveCompletion c2 = new ObjectiveCompletion();
        c2.setId(2L);
        c2.setUserId(1L);
        c2.setObjectiveId(11L);
        c2.setDate(LocalDate.of(2026, 6, 3));

        ObjectiveCompletion c3 = new ObjectiveCompletion();
        c3.setId(3L);
        c3.setUserId(1L);
        c3.setObjectiveId(10L);
        c3.setDate(LocalDate.of(2026, 6, 5));

        when(objectiveCompletionRepository.findByUserIdAndDateBetween(1L, from, to))
                .thenReturn(List.of(c1, c2, c3));

        Map<String, List<Long>> result = objectiveService.getCompletions(1L, from, to);

        assertThat(result).hasSize(2);
        assertThat(result.get("2026-06-03")).containsExactlyInAnyOrder(10L, 11L);
        assertThat(result.get("2026-06-05")).containsExactly(10L);
    }
}
