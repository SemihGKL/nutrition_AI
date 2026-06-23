package com.nutrition.backend.application.service;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
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
    private ObjectiveRepository objectiveRepository;

    @Mock
    private ObjectiveCompletionRepository objectiveCompletionRepository;

    @InjectMocks
    private ObjectiveService objectiveService;

    @Test
    void should_return_empty_list_when_user_has_no_objectives() {
        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of());

        List<Objective> result = objectiveService.getObjectives(1L);

        assertThat(result).isEmpty();
    }

    @Test
    void should_return_all_objectives_when_user_has_objectives() {
        Objective obj1 = new Objective(1L, 1L, 1, "Boire 2L d'eau", 0, "CUSTOM", null);
        Objective obj2 = new Objective(2L, 1L, 3, "30 min de sport", 1, "CUSTOM", null);

        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(obj1, obj2));

        List<Objective> result = objectiveService.getObjectives(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getLabel()).isEqualTo("Boire 2L d'eau");
        assertThat(result.get(1).getLabel()).isEqualTo("30 min de sport");
    }

    @Test
    void should_create_objective_and_return_it_when_day_of_week_and_label_are_valid() {
        Objective toSave = new Objective(null, 1L, 2, "Méditer 10 min", 0, "CUSTOM", null);
        Objective saved = new Objective(10L, 1L, 2, "Méditer 10 min", 0, "CUSTOM", null);

        when(objectiveRepository.save(toSave)).thenReturn(saved);

        Objective result = objectiveService.createObjective(toSave);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getLabel()).isEqualTo("Méditer 10 min");
        verify(objectiveRepository).save(toSave);
    }

    @Test
    void should_delete_objective_when_objective_belongs_to_the_authenticated_user() {
        Objective objective = new Objective(5L, 1L, 1, "Lire 20 pages", 0, "CUSTOM", null);

        when(objectiveRepository.findById(5L)).thenReturn(Optional.of(objective));

        objectiveService.deleteObjective(5L, 1L);

        verify(objectiveRepository).deleteById(5L);
    }

    @Test
    void should_prevent_deletion_when_objective_does_not_belong_to_the_authenticated_user() {
        Objective objective = new Objective(5L, 2L, 1, "Lire 20 pages", 0, "CUSTOM", null);

        when(objectiveRepository.findById(5L)).thenReturn(Optional.of(objective));

        assertThatThrownBy(() -> objectiveService.deleteObjective(5L, 1L))
                .isInstanceOf(com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException.class);

        verify(objectiveRepository, never()).deleteById(anyLong());
    }

    @Test
    void should_prevent_deletion_when_objective_does_not_exist() {
        when(objectiveRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> objectiveService.deleteObjective(99L, 1L))
                .isInstanceOf(com.nutrition.backend.domain.exception.ObjectiveNotFoundException.class);

        verify(objectiveRepository, never()).deleteById(anyLong());
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
    void should_complete_sport_objective_automatically_when_calories_burned_is_positive_and_day_of_week_matches() {
        // Given — lundi = dow 0 selon la logique du service (DayOfWeek.getValue() - 1)
        LocalDate monday = LocalDate.of(2026, 6, 22); // un lundi
        int dow = monday.getDayOfWeek().getValue() - 1; // 0

        Objective sportObj = new Objective(10L, 1L, dow, "Séance sport lundi", 0, "SPORT", null);

        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(sportObj));
        when(objectiveCompletionRepository.existsByObjectiveIdAndDate(10L, monday)).thenReturn(false);

        // When
        objectiveService.autoComplete(1L, monday, 300);

        // Then
        verify(objectiveCompletionRepository).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_not_complete_sport_objective_when_calories_burned_is_zero() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1;

        Objective sportObj = new Objective(10L, 1L, dow, "Séance sport lundi", 0, "SPORT", null);

        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(sportObj));

        // When — caloriesBurned est 0
        objectiveService.autoComplete(1L, monday, 0);

        // Then — aucune complétion créée
        verify(objectiveCompletionRepository, never()).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_not_complete_objective_when_type_is_not_sport() {
        LocalDate monday = LocalDate.of(2026, 6, 22);
        int dow = monday.getDayOfWeek().getValue() - 1;

        Objective customObj = new Objective(20L, 1L, dow, "Boire 2L d'eau", 0, "CUSTOM", null);

        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(customObj));

        // When — type CUSTOM, caloriesBurned positif
        objectiveService.autoComplete(1L, monday, 300);

        // Then — aucune complétion créée
        verify(objectiveCompletionRepository, never()).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_not_complete_sport_objective_when_day_of_week_does_not_match_the_stored_objective_day() {
        LocalDate monday = LocalDate.of(2026, 6, 22);   // lundi = dow 0
        LocalDate tuesday = LocalDate.of(2026, 6, 23);  // mardi = dow 1

        Objective sportObj = new Objective(10L, 1L, monday.getDayOfWeek().getValue() - 1, "Séance sport lundi", 0, "SPORT", null);

        when(objectiveRepository.findByUserId(1L)).thenReturn(List.of(sportObj));

        // When — on appelle autoComplete un mardi
        objectiveService.autoComplete(1L, tuesday, 300);

        // Then — le jour ne correspond pas, aucune complétion
        verify(objectiveCompletionRepository, never()).save(any(ObjectiveCompletion.class));
    }

    @Test
    void should_return_completions_map_indexed_by_date_when_completions_exist_in_date_range() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 7);

        ObjectiveCompletion c1 = new ObjectiveCompletion(1L, 1L, 10L, LocalDate.of(2026, 6, 3));
        ObjectiveCompletion c2 = new ObjectiveCompletion(2L, 1L, 11L, LocalDate.of(2026, 6, 3));
        ObjectiveCompletion c3 = new ObjectiveCompletion(3L, 1L, 10L, LocalDate.of(2026, 6, 5));

        when(objectiveCompletionRepository.findByUserIdAndDateBetween(1L, from, to))
                .thenReturn(List.of(c1, c2, c3));

        Map<String, List<Long>> result = objectiveService.getCompletions(1L, from, to);

        assertThat(result).hasSize(2);
        assertThat(result.get("2026-06-03")).containsExactlyInAnyOrder(10L, 11L);
        assertThat(result.get("2026-06-05")).containsExactly(10L);
    }
}
