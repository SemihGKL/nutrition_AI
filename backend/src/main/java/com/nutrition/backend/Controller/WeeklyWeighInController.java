package com.nutrition.backend.Controller;

import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.Service.WeeklyWeighInService;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.web.WeightEntryMapper;
import com.nutrition.backend.web.dto.CreateWeighInRequest;
import com.nutrition.backend.web.dto.WeightEntryDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/weighin")
public class WeeklyWeighInController {

    private final WeeklyWeighInService weeklyWeighInService;
    private final UserService userService;

    public WeeklyWeighInController(WeeklyWeighInService weeklyWeighInService,
                                   UserService userService) {
        this.weeklyWeighInService = weeklyWeighInService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<WeightEntryDto> saveWeighIn(@Valid @RequestBody CreateWeighInRequest request, Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        WeightEntry entry = new WeightEntry(null, user.getId(), request.date(), request.weight(), request.note());
        WeightEntry saved = weeklyWeighInService.saveWeighIn(entry);
        return ResponseEntity.ok(WeightEntryMapper.toDto(saved));
    }

    @GetMapping
    public ResponseEntity<List<WeightEntryDto>> getAllMyWeighIns(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        List<WeightEntryDto> dtos = weeklyWeighInService.getAllByUser(user.getId()).stream()
                .map(WeightEntryMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/latest")
    public ResponseEntity<WeightEntryDto> getMyLatest(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        Optional<WeightEntry> latest = weeklyWeighInService.getLatestByUser(user.getId());
        return latest.map(e -> ResponseEntity.ok(WeightEntryMapper.toDto(e)))
                .orElse(ResponseEntity.noContent().build());
    }
}
