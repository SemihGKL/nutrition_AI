package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.Objective;
import com.nutrition.backend.domain.ports.ObjectiveRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ObjectiveRepositoryAdapter implements ObjectiveRepository {

    private final UserObjectiveJpaRepository userObjectiveJpaRepository;

    public ObjectiveRepositoryAdapter(UserObjectiveJpaRepository userObjectiveJpaRepository) {
        this.userObjectiveJpaRepository = userObjectiveJpaRepository;
    }

    @Override
    public List<Objective> findByUserId(Long userId) {
        return userObjectiveJpaRepository.findByUserId(userId).stream()
                .map(ObjectiveEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Objective> findById(Long id) {
        return userObjectiveJpaRepository.findById(id)
                .map(ObjectiveEntityMapper::toDomain);
    }

    @Override
    public Objective save(Objective objective) {
        UserObjectiveJpaEntity entity = ObjectiveEntityMapper.toJpaEntity(objective);
        UserObjectiveJpaEntity saved = userObjectiveJpaRepository.save(entity);
        return ObjectiveEntityMapper.toDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        userObjectiveJpaRepository.deleteById(id);
    }
}
