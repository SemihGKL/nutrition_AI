package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GetObjectivesUseCase {

    private final ObjectiveRepository objectiveRepository;

    public GetObjectivesUseCase(ObjectiveRepository objectiveRepository) {
        this.objectiveRepository = objectiveRepository;
    }

    public List<Objective> execute(Long userId) {
        return objectiveRepository.findByUserId(userId);
    }
}
