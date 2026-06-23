package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class GetWeightEntriesUseCase {

    private final WeightEntryRepository weightEntryRepository;

    public GetWeightEntriesUseCase(WeightEntryRepository weightEntryRepository) {
        this.weightEntryRepository = weightEntryRepository;
    }

    public List<WeightEntry> allByUser(Long userId) {
        return weightEntryRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Optional<WeightEntry> latestByUser(Long userId) {
        List<WeightEntry> entries = weightEntryRepository.findByUserIdOrderByDateDesc(userId);
        return entries.isEmpty() ? Optional.empty() : Optional.of(entries.get(0));
    }
}
