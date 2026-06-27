package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class GetObjectiveCompletionsUseCase {

    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public GetObjectiveCompletionsUseCase(ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public Map<String, List<Long>> execute(Long userId, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) throw new IllegalArgumentException("from must not be after to");
        if (ChronoUnit.DAYS.between(from, to) > 365) throw new IllegalArgumentException("date range must not exceed 365 days");
        return objectiveCompletionRepository.findByUserIdAndDateBetween(userId, from, to)
                .stream()
                .collect(Collectors.groupingBy(
                        c -> c.getDate().toString(),
                        Collectors.mapping(ObjectiveCompletion::getObjectiveId, Collectors.toList())
                ));
    }
}
