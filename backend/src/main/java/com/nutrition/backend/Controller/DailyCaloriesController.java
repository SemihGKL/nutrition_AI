package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.DailyRecapService;
import com.nutrition.backend.Exception.UserNotFoundException;
import com.nutrition.backend.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-kcal")
public class DailyCaloriesController {

    private final DailyCaloriesService dailyCaloriesService;
    private final DailyRecapService dailyRecapService;
    private final UserRepository userRepository;

    public DailyCaloriesController(DailyCaloriesService dailyCaloriesService,
                                   DailyRecapService dailyRecapService,
                                   UserRepository userRepository) {
        this.dailyCaloriesService = dailyCaloriesService;
        this.dailyRecapService = dailyRecapService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{userId}/{date}")
    public List<DailyCalories> getDailyCalories(@PathVariable Long userId, @PathVariable String date) {
        return dailyCaloriesService.getDailyCalories(userId, LocalDate.parse(date));
    }

    @GetMapping("/{userId}")
    public List<DailyCalories> getAllDailyCalories(@PathVariable Long userId) {
        return dailyCaloriesService.getAllDailyCalories(userId);
    }

    @PostMapping
    public ResponseEntity<DailyCalories> createDailyCalories(@RequestBody CreateDailyCaloriesRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + request.userId()));

        DailyCalories entry = new DailyCalories();
        if (request.id() != null) entry.setId(request.id());
        entry.setUser(user);
        entry.setDate(request.date());
        entry.setCaloriesConsumed(request.caloriesConsumed());
        entry.setSteps(request.steps());
        entry.setCaloriesBurned(request.caloriesBurned());
        entry.setConfirmed(request.confirmed());

        return ResponseEntity.ok(dailyCaloriesService.saveDailyCalories(entry));
    }

    @GetMapping("/{userId}/recap")
    public ResponseEntity<DailyRecapResponse> getRecap(@PathVariable Long userId, @RequestParam String date) {
        DailyRecapResponse recap = dailyRecapService.getRecap(userId, LocalDate.parse(date));
        return ResponseEntity.ok(recap);
    }
}
