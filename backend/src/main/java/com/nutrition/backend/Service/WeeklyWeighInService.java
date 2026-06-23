package com.nutrition.backend.Service;

import com.nutrition.backend.application.usecase.GetWeightEntriesUseCase;
import com.nutrition.backend.application.usecase.RecordWeightEntryUseCase;
import com.nutrition.backend.domain.entity.WeightEntry;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WeeklyWeighInService {

    private final RecordWeightEntryUseCase recordWeightEntryUseCase;
    private final GetWeightEntriesUseCase getWeightEntriesUseCase;

    public WeeklyWeighInService(RecordWeightEntryUseCase recordWeightEntryUseCase,
                                GetWeightEntriesUseCase getWeightEntriesUseCase) {
        this.recordWeightEntryUseCase = recordWeightEntryUseCase;
        this.getWeightEntriesUseCase = getWeightEntriesUseCase;
    }

    public WeightEntry saveWeighIn(WeightEntry entry) {
        return recordWeightEntryUseCase.execute(entry);
    }

    public List<WeightEntry> getAllByUser(Long userId) {
        return getWeightEntriesUseCase.allByUser(userId);
    }

    public Optional<WeightEntry> getLatestByUser(Long userId) {
        return getWeightEntriesUseCase.latestByUser(userId);
    }
}
