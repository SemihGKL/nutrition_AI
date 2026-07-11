package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.CompleteObjectiveUseCase;
import com.nutrition.backend.application.usecase.CreateObjectiveUseCase;
import com.nutrition.backend.application.usecase.DeleteObjectiveUseCase;
import com.nutrition.backend.application.usecase.GetObjectiveCompletionsUseCase;
import com.nutrition.backend.application.usecase.GetObjectivesUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.UncompleteObjectiveUseCase;
import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.infrastructure.web.dto.CreateObjectiveRequest;
import com.nutrition.backend.infrastructure.web.dto.ObjectiveDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/objectives")
public class ObjectiveController {

    private final GetObjectivesUseCase getObjectivesUseCase;
    private final CreateObjectiveUseCase createObjectiveUseCase;
    private final DeleteObjectiveUseCase deleteObjectiveUseCase;
    private final CompleteObjectiveUseCase completeObjectiveUseCase;
    private final UncompleteObjectiveUseCase uncompleteObjectiveUseCase;
    private final GetObjectiveCompletionsUseCase getObjectiveCompletionsUseCase;
    private final GetUserProfileUseCase getUserProfileUseCase;

    public ObjectiveController(GetObjectivesUseCase getObjectivesUseCase,
                               CreateObjectiveUseCase createObjectiveUseCase,
                               DeleteObjectiveUseCase deleteObjectiveUseCase,
                               CompleteObjectiveUseCase completeObjectiveUseCase,
                               UncompleteObjectiveUseCase uncompleteObjectiveUseCase,
                               GetObjectiveCompletionsUseCase getObjectiveCompletionsUseCase,
                               GetUserProfileUseCase getUserProfileUseCase) {
        this.getObjectivesUseCase = getObjectivesUseCase;
        this.createObjectiveUseCase = createObjectiveUseCase;
        this.deleteObjectiveUseCase = deleteObjectiveUseCase;
        this.completeObjectiveUseCase = completeObjectiveUseCase;
        this.uncompleteObjectiveUseCase = uncompleteObjectiveUseCase;
        this.getObjectiveCompletionsUseCase = getObjectiveCompletionsUseCase;
        this.getUserProfileUseCase = getUserProfileUseCase;
    }

    @GetMapping
    public List<ObjectiveDto> getObjectives(Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        return getObjectivesUseCase.execute(user.getId()).stream()
                .map(o -> new ObjectiveDto(o.getId(), o.getDayOfWeek(), o.getLabel(), o.getPosition(), o.getType(), o.getTargetValue()))
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<ObjectiveDto> createObjective(@Valid @RequestBody CreateObjectiveRequest request, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        Objective objective = new Objective(null, user.getId(), request.dayOfWeek(),
                request.label(), 0, request.type() != null ? request.type() : "CUSTOM", request.targetValue());
        Objective saved = createObjectiveUseCase.execute(objective);

        ObjectiveDto dto = new ObjectiveDto(saved.getId(), saved.getDayOfWeek(), saved.getLabel(), saved.getPosition(), saved.getType(), saved.getTargetValue());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteObjective(@PathVariable Long id, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        deleteObjectiveUseCase.execute(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/completions/{date}")
    public ResponseEntity<Void> markDone(@PathVariable Long id, @PathVariable String date, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        completeObjectiveUseCase.execute(id, user.getId(), LocalDate.parse(date));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/completions/{date}")
    public ResponseEntity<Void> markUndone(@PathVariable Long id, @PathVariable String date, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        uncompleteObjectiveUseCase.execute(id, user.getId(), LocalDate.parse(date));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/completions")
    public Map<String, List<Long>> getCompletions(
            @RequestParam String from,
            @RequestParam String to,
            Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        return getObjectiveCompletionsUseCase.execute(user.getId(), LocalDate.parse(from), LocalDate.parse(to));
    }
}
