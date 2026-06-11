package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.Service.DailyCaloriesService;
import com.nutrition.backend.Service.DailyRecapService;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.web.dto.DailyRecapResponse;
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

    public DailyCaloriesController(DailyCaloriesService dailyCaloriesService,
                                   DailyRecapService dailyRecapService,
                                   UserService userService) {
        this.dailyCaloriesService = dailyCaloriesService;
        this.dailyRecapService = dailyRecapService;
        this.userService = userService;
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
                .orElseThrow(() -> new DailyCaloriesNotFoundException("Aucune entrée pour le " + date));
    }

    @PostMapping
    public ResponseEntity<DailyCalories> saveEntry(@RequestBody CreateDailyCaloriesRequest request, Authentication auth) {
        User user = userService.getByEmail(auth.getName());

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

    @GetMapping("/{date}/recap")
    public ResponseEntity<DailyRecapResponse> getRecap(@PathVariable String date, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return ResponseEntity.ok(dailyRecapService.getRecap(user.getId(), LocalDate.parse(date)));
    }
}
