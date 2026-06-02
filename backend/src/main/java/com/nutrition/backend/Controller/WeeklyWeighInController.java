package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Exception.UserNotFoundException;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.Service.WeeklyWeighInService;
import com.nutrition.backend.web.dto.CreateWeighInRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/weighin")
public class WeeklyWeighInController {

    private final WeeklyWeighInService weeklyWeighInService;
    private final UserRepository userRepository;

    public WeeklyWeighInController(WeeklyWeighInService weeklyWeighInService, UserRepository userRepository) {
        this.weeklyWeighInService = weeklyWeighInService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<WeeklyWeighIn> saveWeighIn(@RequestBody CreateWeighInRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + request.userId()));

        WeeklyWeighIn weighIn = new WeeklyWeighIn();
        weighIn.setUser(user);
        weighIn.setDate(request.date());
        weighIn.setWeight(request.weight());
        weighIn.setNote(request.note());

        return ResponseEntity.ok(weeklyWeighInService.saveWeighIn(weighIn));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<WeeklyWeighIn>> getAllByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(weeklyWeighInService.getAllByUser(userId));
    }

    @GetMapping("/{userId}/latest")
    public ResponseEntity<WeeklyWeighIn> getLatest(@PathVariable Long userId) {
        Optional<WeeklyWeighIn> latest = weeklyWeighInService.getLatestByUser(userId);
        return latest.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
