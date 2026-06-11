package com.nutrition.backend.Service;

import com.nutrition.backend.Class.ObjectiveCompletion;
import com.nutrition.backend.Class.UserObjective;
import com.nutrition.backend.Exception.ObjectiveAccessDeniedException;
import com.nutrition.backend.Exception.ObjectiveNotFoundException;
import com.nutrition.backend.Repository.ObjectiveCompletionRepository;
import com.nutrition.backend.Repository.UserObjectiveRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ObjectiveService {

    private final UserObjectiveRepository userObjectiveRepository;
    private final ObjectiveCompletionRepository objectiveCompletionRepository;

    public ObjectiveService(UserObjectiveRepository userObjectiveRepository,
                            ObjectiveCompletionRepository objectiveCompletionRepository) {
        this.userObjectiveRepository = userObjectiveRepository;
        this.objectiveCompletionRepository = objectiveCompletionRepository;
    }

    public List<UserObjective> getObjectives(Long userId) {
        return userObjectiveRepository.findByUserId(userId);
    }

    public UserObjective createObjective(UserObjective objective) {
        return userObjectiveRepository.save(objective);
    }

    public void deleteObjective(Long objectiveId, Long userId) {
        UserObjective objective = userObjectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new ObjectiveNotFoundException(objectiveId));
        if (!objective.getUserId().equals(userId)) {
            throw new ObjectiveAccessDeniedException(objectiveId);
        }
        userObjectiveRepository.deleteById(objectiveId);
    }

    public void markDone(Long objectiveId, Long userId, LocalDate date) {
        if (objectiveCompletionRepository.existsByObjectiveIdAndDate(objectiveId, date)) {
            return;
        }
        ObjectiveCompletion completion = new ObjectiveCompletion();
        completion.setObjectiveId(objectiveId);
        completion.setUserId(userId);
        completion.setDate(date);
        objectiveCompletionRepository.save(completion);
    }

    public void markUndone(Long objectiveId, Long userId, LocalDate date) {
        objectiveCompletionRepository.deleteByObjectiveIdAndDate(objectiveId, date);
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
