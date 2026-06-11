package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.Service.WeeklyWeighInService;
import com.nutrition.backend.web.dto.CreateWeighInRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/weighin")
public class WeeklyWeighInController {

    private final WeeklyWeighInService weeklyWeighInService;
    private final UserService userService;

    public WeeklyWeighInController(WeeklyWeighInService weeklyWeighInService, UserService userService) {
        this.weeklyWeighInService = weeklyWeighInService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<WeeklyWeighIn> saveWeighIn(@RequestBody CreateWeighInRequest request, Authentication auth) {
        User user = userService.getByEmail(auth.getName());

        WeeklyWeighIn weighIn = new WeeklyWeighIn();
        weighIn.setUser(user);
        weighIn.setDate(request.date());
        weighIn.setWeight(request.weight());
        weighIn.setNote(request.note());

        return ResponseEntity.ok(weeklyWeighInService.saveWeighIn(weighIn));
    }

    @GetMapping
    public ResponseEntity<List<WeeklyWeighIn>> getAllMyWeighIns(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return ResponseEntity.ok(weeklyWeighInService.getAllByUser(user.getId()));
    }

    @GetMapping("/latest")
    public ResponseEntity<WeeklyWeighIn> getMyLatest(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        Optional<WeeklyWeighIn> latest = weeklyWeighInService.getLatestByUser(user.getId());
        return latest.map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }
}
