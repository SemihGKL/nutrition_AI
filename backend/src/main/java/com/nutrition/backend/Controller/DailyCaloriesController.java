package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.DailyRecapService;
import com.nutrition.backend.Service.ObjectiveService;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.infrastructure.persistence.UserJpaEntity;
import com.nutrition.backend.infrastructure.persistence.UserJpaRepository;
import com.nutrition.backend.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-kcal")
public class DailyCaloriesController {

    private final DailyCaloriesService dailyCaloriesService;
    private final DailyRecapService dailyRecapService;
    private final UserService userService;
    private final ObjectiveService objectiveService;
    private final UserJpaRepository userJpaRepository;

    public DailyCaloriesController(DailyCaloriesService dailyCaloriesService,
                                   DailyRecapService dailyRecapService,
                                   UserService userService,
                                   ObjectiveService objectiveService,
                                   UserJpaRepository userJpaRepository) {
        this.dailyCaloriesService = dailyCaloriesService;
        this.dailyRecapService = dailyRecapService;
        this.userService = userService;
        this.objectiveService = objectiveService;
        this.userJpaRepository = userJpaRepository;
    }

    @GetMapping
    public List<DailyCalories> getAllMyEntries(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return dailyCaloriesService.getAllDailyCalories(user.getId());
    }

    @GetMapping("/{date}")
    public ResponseEntity<DailyCalories> getEntryByDate(@PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return dailyCaloriesService.getDailyCalories(user.getId(), LocalDate.parse(date))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DailyCalories> saveEntry(@Valid @RequestBody CreateDailyCaloriesRequest request, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        UserJpaEntity userJpaEntity = userJpaRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User JPA entity not found for id: " + user.getId()));

        DailyCalories entry = new DailyCalories();
        if (request.id() != null) entry.setId(request.id());
        entry.setUser(userJpaEntity);
        entry.setDate(request.date());
        entry.setCaloriesConsumed(request.caloriesConsumed());
        entry.setSteps(request.steps());
        entry.setCaloriesBurned(request.caloriesBurned());
        entry.setConfirmed(request.confirmed());

        DailyCalories saved = dailyCaloriesService.saveDailyCalories(entry);
        objectiveService.autoComplete(user.getId(), request.date(), request.caloriesBurned());
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{date}/recap")
    public ResponseEntity<DailyRecapResponse> getRecap(@PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return ResponseEntity.ok(dailyRecapService.getRecap(user.getId(), LocalDate.parse(date)));
    }
}
