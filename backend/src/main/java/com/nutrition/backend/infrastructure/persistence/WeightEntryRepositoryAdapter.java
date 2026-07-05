package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class WeightEntryRepositoryAdapter implements WeightEntryRepository {

    private final WeeklyWeighInJpaRepository weeklyWeighInJpaRepository;

    public WeightEntryRepositoryAdapter(WeeklyWeighInJpaRepository weeklyWeighInJpaRepository) {
        this.weeklyWeighInJpaRepository = weeklyWeighInJpaRepository;
    }

    @Transactional
    @Override
    public WeightEntry save(WeightEntry entry) {
        // Upsert atomique sur (user_id, date) : re-peser le même jour met à jour la pesée
        // au lieu d'accumuler des doublons, et rend "latest" déterministe.
        weeklyWeighInJpaRepository.upsert(
                entry.getUserId(),
                entry.getDate(),
                entry.getWeight(),
                entry.getNote()
        );
        return weeklyWeighInJpaRepository.findByUserIdAndDate(entry.getUserId(), entry.getDate())
                .map(WeightEntryEntityMapper::toDomain)
                .orElseThrow(() -> new IllegalStateException(
                        "Pesée introuvable après upsert : userId="
                                + entry.getUserId() + " date=" + entry.getDate()));
    }

    @Override
    public List<WeightEntry> findByUserIdOrderByDateDesc(Long userId) {
        return weeklyWeighInJpaRepository.findTop104ByUserIdOrderByDateDesc(userId).stream()
                .map(WeightEntryEntityMapper::toDomain)
                .collect(Collectors.toList());
    }
}
