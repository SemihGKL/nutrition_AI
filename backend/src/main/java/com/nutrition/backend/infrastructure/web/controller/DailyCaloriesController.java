package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.DailyRecapResult;
import com.nutrition.backend.application.usecase.GetDailyEntryUseCase;
import com.nutrition.backend.application.usecase.GetDailyRecapUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.RecordDailyEntryUseCase;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.infrastructure.web.DailyEntryMapper;
import com.nutrition.backend.infrastructure.web.dto.CreateDailyCaloriesRequest;
import com.nutrition.backend.infrastructure.web.dto.DailyEntryDto;
import com.nutrition.backend.infrastructure.web.dto.DailyRecapResponse;
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

    private final GetDailyEntryUseCase getDailyEntryUseCase;
    private final RecordDailyEntryUseCase recordDailyEntryUseCase;
    private final GetDailyRecapUseCase getDailyRecapUseCase;
    private final GetUserProfileUseCase getUserProfileUseCase;

    public DailyCaloriesController(GetDailyEntryUseCase getDailyEntryUseCase,
                                   RecordDailyEntryUseCase recordDailyEntryUseCase,
                                   GetDailyRecapUseCase getDailyRecapUseCase,
                                   GetUserProfileUseCase getUserProfileUseCase) {
        this.getDailyEntryUseCase = getDailyEntryUseCase;
        this.recordDailyEntryUseCase = recordDailyEntryUseCase;
        this.getDailyRecapUseCase = getDailyRecapUseCase;
        this.getUserProfileUseCase = getUserProfileUseCase;
    }

    @GetMapping
    public List<DailyEntryDto> getAllMyEntries(Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        return getDailyEntryUseCase.allByUser(user.getId()).stream()
                .map(DailyEntryMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{date}")
    public ResponseEntity<DailyEntryDto> getEntryByDate(@PathVariable String date, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        return getDailyEntryUseCase.byUserAndDate(user.getId(), LocalDate.parse(date))
                .map(DailyEntryMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DailyEntryDto> saveEntry(@Valid @RequestBody CreateDailyCaloriesRequest request,
                                                   Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());

        DailyEntry entry = new DailyEntry(
                request.id(),
                user.getId(),
                request.date(),
                request.caloriesConsumed(),
                request.steps(),
                request.caloriesBurned(),
                request.confirmed()
        );

        DailyEntry saved = recordDailyEntryUseCase.execute(entry);
        return ResponseEntity.ok(DailyEntryMapper.toDto(saved));
    }

    @GetMapping("/{date}/recap")
    public ResponseEntity<DailyRecapResponse> getRecap(@PathVariable String date, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        DailyRecapResult result = getDailyRecapUseCase.execute(user.getId(), LocalDate.parse(date));
        return ResponseEntity.ok(new DailyRecapResponse(
                result.date(), result.caloriesConsumed(), result.caloriesBurned(),
                result.steps(), result.stepsKcal(), result.netCalories(),
                result.dailyCalorieGoal(), result.mbr(), result.tdee(),
                result.deficit(), result.deficitPercentage(), result.confirmed()
        ));
    }
}
