package com.nutrition.backend.Controller;

import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.DailyRecapService;
import com.nutrition.backend.Service.ObjectiveService;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.web.DailyEntryMapper;
import com.nutrition.backend.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.web.dto.DailyEntryDto;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/daily-kcal")
public class DailyCaloriesController {

    private final DailyCaloriesService dailyCaloriesService;
    private final DailyRecapService dailyRecapService;
    private final UserService userService;
    private final ObjectiveService objectiveService;

    public DailyCaloriesController(DailyCaloriesService dailyCaloriesService,
                                   DailyRecapService dailyRecapService,
                                   UserService userService,
                                   ObjectiveService objectiveService) {
        this.dailyCaloriesService = dailyCaloriesService;
        this.dailyRecapService = dailyRecapService;
        this.userService = userService;
        this.objectiveService = objectiveService;
    }

    @GetMapping
    public List<DailyEntryDto> getAllMyEntries(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return dailyCaloriesService.getAllDailyCalories(user.getId()).stream()
                .map(DailyEntryMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{date}")
    public ResponseEntity<DailyEntryDto> getEntryByDate(@PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return dailyCaloriesService.getDailyCalories(user.getId(), LocalDate.parse(date))
                .map(DailyEntryMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DailyEntryDto> saveEntry(@Valid @RequestBody CreateDailyCaloriesRequest request,
                                                   Authentication auth) {
        User user = userService.getByEmail(auth.getName());

        DailyEntry entry = new DailyEntry(
                request.id(),
                user.getId(),
                request.date(),
                request.caloriesConsumed(),
                request.steps(),
                request.caloriesBurned(),
                request.confirmed()
        );

        DailyEntry saved = dailyCaloriesService.saveDailyCalories(entry);
        objectiveService.autoComplete(user.getId(), request.date(), request.caloriesBurned());
        return ResponseEntity.ok(DailyEntryMapper.toDto(saved));
    }

    @GetMapping("/{date}/recap")
    public ResponseEntity<DailyRecapResponse> getRecap(@PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return ResponseEntity.ok(dailyRecapService.getRecap(user.getId(), LocalDate.parse(date)));
    }
}
