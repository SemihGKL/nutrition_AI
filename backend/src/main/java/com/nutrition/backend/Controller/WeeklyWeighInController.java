package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Service.WeeklyWeighInService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/weighin")
public class WeeklyWeighInController {

    private final WeeklyWeighInService weeklyWeighInService;

    public WeeklyWeighInController(WeeklyWeighInService weeklyWeighInService) {
        this.weeklyWeighInService = weeklyWeighInService;
    }

    @PostMapping
    public ResponseEntity<WeeklyWeighIn> saveWeighIn(@RequestBody WeeklyWeighIn weighIn) {
        WeeklyWeighIn saved = weeklyWeighInService.saveWeighIn(weighIn);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<WeeklyWeighIn>> getAllByUser(@PathVariable Long userId) {
        List<WeeklyWeighIn> weighIns = weeklyWeighInService.getAllByUser(userId);
        return ResponseEntity.ok(weighIns);
    }

    @GetMapping("/{userId}/latest")
    public ResponseEntity<WeeklyWeighIn> getLatest(@PathVariable Long userId) {
        Optional<WeeklyWeighIn> latest = weeklyWeighInService.getLatestByUser(userId);
        return latest.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
