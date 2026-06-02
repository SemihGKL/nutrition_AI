package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.DailyRecapService;
import com.nutrition.backend.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-kcal")
public class DailyCaloriesController {
    private final DailyCaloriesService dailyCaloriesService;
    private final DailyRecapService dailyRecapService;

    public DailyCaloriesController(DailyCaloriesService dailyCaloriesService, UserService userService) {
        this.dailyCaloriesService = dailyCaloriesService;
        this.dailyRecapService = new DailyRecapService(userService, dailyCaloriesService);
    }

    @GetMapping("/{userId}/{date}")
    public List<DailyCalories> getDailyCalories(@PathVariable Long userId, @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        return dailyCaloriesService.getDailyCalories(userId, localDate);
    }

    @GetMapping("/{userId}")
    public List<DailyCalories> getAllDailyCalories(@PathVariable Long userId) {
        return dailyCaloriesService.getAllDailyCalories(userId);
    }

    @PostMapping
    public DailyCalories createDailyCalories(@RequestBody DailyCalories dailyCalories) {
        return dailyCaloriesService.saveDailyCalories(dailyCalories);
    }

    @GetMapping("/{userId}/recap")
    public ResponseEntity<DailyRecapResponse> getRecap(
            @PathVariable Long userId,
            @RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        DailyRecapResponse recap = dailyRecapService.getRecap(userId, localDate);
        return ResponseEntity.ok(recap);
    }

    @ExceptionHandler(DailyCaloriesNotFoundException.class)
    public ResponseEntity<String> handleDailyCaloriesNotFound(DailyCaloriesNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }
}
