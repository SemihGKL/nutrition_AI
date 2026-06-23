package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.UserObjective;
import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.ObjectiveService;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.web.dto.CreateObjectiveRequest;
import com.nutrition.backend.web.dto.ObjectiveDto;
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

    private final ObjectiveService objectiveService;
    private final UserService userService;
    private final DailyCaloriesService dailyCaloriesService;

    public ObjectiveController(ObjectiveService objectiveService, UserService userService, DailyCaloriesService dailyCaloriesService) {
        this.objectiveService = objectiveService;
        this.userService = userService;
        this.dailyCaloriesService = dailyCaloriesService;
    }

    @GetMapping
    public List<ObjectiveDto> getObjectives(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return objectiveService.getObjectives(user.getId()).stream()
                .map(o -> new ObjectiveDto(o.getId(), o.getDayOfWeek(), o.getLabel(), o.getPosition(), o.getType(), o.getTargetValue()))
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<ObjectiveDto> createObjective(@RequestBody CreateObjectiveRequest request, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        UserObjective objective = new UserObjective();
        objective.setUserId(user.getId());
        objective.setDayOfWeek(request.dayOfWeek());
        objective.setLabel(request.label());
        objective.setType(request.type() != null ? request.type() : "CUSTOM");
        objective.setTargetValue(request.targetValue());
        UserObjective saved = objectiveService.createObjective(objective);

        if ("SPORT".equals(saved.getType())) {
            LocalDate today = LocalDate.now();
            int todayDow = today.getDayOfWeek().getValue() - 1;
            if (saved.getDayOfWeek() == todayDow) {
                dailyCaloriesService.getDailyCalories(user.getId(), today)
                        .filter(entry -> entry.getCaloriesBurned() > 0)
                        .ifPresent(entry -> objectiveService.markDone(saved.getId(), user.getId(), today));
            }
        }

        ObjectiveDto dto = new ObjectiveDto(saved.getId(), saved.getDayOfWeek(), saved.getLabel(), saved.getPosition(), saved.getType(), saved.getTargetValue());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteObjective(@PathVariable Long id, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        objectiveService.deleteObjective(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/completions/{date}")
    public ResponseEntity<Void> markDone(@PathVariable Long id, @PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        objectiveService.markDone(id, user.getId(), LocalDate.parse(date));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/completions/{date}")
    public ResponseEntity<Void> markUndone(@PathVariable Long id, @PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        objectiveService.markUndone(id, user.getId(), LocalDate.parse(date));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/completions")
    public Map<String, List<Long>> getCompletions(
            @RequestParam String from,
            @RequestParam String to,
            Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return objectiveService.getCompletions(user.getId(), LocalDate.parse(from), LocalDate.parse(to));
    }
}
