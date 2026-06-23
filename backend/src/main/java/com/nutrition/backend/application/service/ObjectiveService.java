package com.nutrition.backend.application.service;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import com.nutrition.backend.domain.exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.domain.exception.ObjectiveNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ObjectiveService {

    private final ObjectiveRepository objectiveRepository;
    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public ObjectiveService(ObjectiveRepository objectiveRepository,
                            ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.objectiveRepository = objectiveRepository;
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public List<Objective> getObjectives(Long userId) {
        return objectiveRepository.findByUserId(userId);
    }

    public Objective createObjective(Objective objective) {
        return objectiveRepository.save(objective);
    }

    public void deleteObjective(Long objectiveId, Long userId) {
        Objective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new ObjectiveNotFoundException(objectiveId));
        if (!objective.getUserId().equals(userId)) {
            throw new ObjectiveAccessDeniedException(objectiveId);
        }
        objectiveRepository.deleteById(objectiveId);
    }

    public void markDone(Long objectiveId, Long userId, LocalDate date) {
        if (objectiveCompletionRepository.existsByObjectiveIdAndDate(objectiveId, date)) {
            return;
        }
        ObjectiveCompletion completion = new ObjectiveCompletion(null, userId, objectiveId, date);
        objectiveCompletionRepository.save(completion);
    }

    public void markUndone(Long objectiveId, Long userId, LocalDate date) {
        objectiveCompletionRepository.deleteByObjectiveIdAndDate(objectiveId, date);
    }

    public void autoComplete(Long userId, LocalDate date, int caloriesBurned) {
        int dow = date.getDayOfWeek().getValue() - 1; // 0=Lundi ... 6=Dimanche
        for (Objective obj : objectiveRepository.findByUserId(userId)) {
            if ("SPORT".equals(obj.getType()) && obj.getDayOfWeek() == dow && caloriesBurned > 0) {
                markDone(obj.getId(), userId, date);
            }
        }
    }

    public Map<String, List<Long>> getCompletions(Long userId, LocalDate from, LocalDate to) {
        return objectiveCompletionRepository.findByUserIdAndDateBetween(userId, from, to)
                .stream()
                .collect(Collectors.groupingBy(
                        c -> c.getDate().toString(),
                        Collectors.mapping(ObjectiveCompletion::getObjectiveId, Collectors.toList())
                ));
    }
}
