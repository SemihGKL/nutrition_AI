package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class WeightEntryRepositoryAdapter implements WeightEntryRepository {

    private final WeeklyWeighInJpaRepository weeklyWeighInJpaRepository;
    private final UserJpaRepository userJpaRepository;

    public WeightEntryRepositoryAdapter(WeeklyWeighInJpaRepository weeklyWeighInJpaRepository,
                                        UserJpaRepository userJpaRepository) {
        this.weeklyWeighInJpaRepository = weeklyWeighInJpaRepository;
        this.userJpaRepository = userJpaRepository;
    }

    @Override
    public WeightEntry save(WeightEntry entry) {
        UserJpaEntity user = userJpaRepository.findById(entry.getUserId())
                .orElseThrow(() -> new IllegalStateException("User not found: " + entry.getUserId()));
        WeeklyWeighInJpaEntity entity = WeightEntryEntityMapper.toJpaEntity(entry, user);
        WeeklyWeighInJpaEntity saved = weeklyWeighInJpaRepository.save(entity);
        return WeightEntryEntityMapper.toDomain(saved);
    }

    @Override
    public List<WeightEntry> findByUserIdOrderByDateDesc(Long userId) {
        return weeklyWeighInJpaRepository.findTop104ByUserIdOrderByDateDesc(userId).stream()
                .map(WeightEntryEntityMapper::toDomain)
                .collect(Collectors.toList());
    }
}
