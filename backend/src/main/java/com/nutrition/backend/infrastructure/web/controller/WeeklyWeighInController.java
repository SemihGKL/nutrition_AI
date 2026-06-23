package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.GetWeightEntriesUseCase;
import com.nutrition.backend.application.usecase.RecordWeightEntryUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.infrastructure.web.WeightEntryMapper;
import com.nutrition.backend.infrastructure.web.dto.CreateWeighInRequest;
import com.nutrition.backend.infrastructure.web.dto.WeightEntryDto;
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

    private final RecordWeightEntryUseCase recordWeightEntryUseCase;
    private final GetWeightEntriesUseCase getWeightEntriesUseCase;
    private final GetUserProfileUseCase getUserProfileUseCase;

    public WeeklyWeighInController(RecordWeightEntryUseCase recordWeightEntryUseCase,
                                   GetWeightEntriesUseCase getWeightEntriesUseCase,
                                   GetUserProfileUseCase getUserProfileUseCase) {
        this.recordWeightEntryUseCase = recordWeightEntryUseCase;
        this.getWeightEntriesUseCase = getWeightEntriesUseCase;
        this.getUserProfileUseCase = getUserProfileUseCase;
    }

    @PostMapping
    public ResponseEntity<WeightEntryDto> saveWeighIn(@Valid @RequestBody CreateWeighInRequest request, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        WeightEntry entry = new WeightEntry(null, user.getId(), request.date(), request.weight(), request.note());
        WeightEntry saved = recordWeightEntryUseCase.execute(entry);
        return ResponseEntity.ok(WeightEntryMapper.toDto(saved));
    }

    @GetMapping
    public ResponseEntity<List<WeightEntryDto>> getAllMyWeighIns(Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        List<WeightEntryDto> dtos = getWeightEntriesUseCase.allByUser(user.getId()).stream()
                .map(WeightEntryMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/latest")
    public ResponseEntity<WeightEntryDto> getMyLatest(Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        Optional<WeightEntry> latest = getWeightEntriesUseCase.latestByUser(user.getId());
        return latest.map(e -> ResponseEntity.ok(WeightEntryMapper.toDto(e)))
                .orElse(ResponseEntity.noContent().build());
    }
}
