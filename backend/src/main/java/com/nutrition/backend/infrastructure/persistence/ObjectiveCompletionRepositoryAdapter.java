package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.ObjectiveCompletion;
import com.nutrition.backend.domain.ports.ObjectiveCompletionRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ObjectiveCompletionRepositoryAdapter implements ObjectiveCompletionRepository {

    private final ObjectiveCompletionJpaRepository objectiveCompletionJpaRepository;

    public ObjectiveCompletionRepositoryAdapter(ObjectiveCompletionJpaRepository objectiveCompletionJpaRepository) {
        this.objectiveCompletionJpaRepository = objectiveCompletionJpaRepository;
    }

    @Override
    public boolean existsByObjectiveIdAndDate(Long objectiveId, LocalDate date) {
        return objectiveCompletionJpaRepository.existsByObjectiveIdAndDate(objectiveId, date);
    }

    @Override
    public void deleteByObjectiveIdAndDate(Long objectiveId, LocalDate date) {
        objectiveCompletionJpaRepository.deleteByObjectiveIdAndDate(objectiveId, date);
    }

    @Override
    public List<ObjectiveCompletion> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to) {
        return objectiveCompletionJpaRepository.findByUserIdAndDateBetween(userId, from, to).stream()
                .map(ObjectiveEntityMapper::completionToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public ObjectiveCompletion save(ObjectiveCompletion completion) {
        ObjectiveCompletionJpaEntity entity = ObjectiveEntityMapper.completionToJpaEntity(completion);
        ObjectiveCompletionJpaEntity saved = objectiveCompletionJpaRepository.save(entity);
        return ObjectiveEntityMapper.completionToDomain(saved);
    }
}
