package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class DailyCaloriesRepositoryAdapter implements DailyEntryRepository {

    private final DailyCaloriesJpaRepository jpaRepository;

    public DailyCaloriesRepositoryAdapter(DailyCaloriesJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<DailyEntry> findByUserIdAndDate(Long userId, LocalDate date) {
        return jpaRepository.findByUserIdAndDate(userId, date)
                .map(DailyCaloriesEntityMapper::toDomain);
    }

    @Override
    public List<DailyEntry> findByUserId(Long userId) {
        return jpaRepository.findTop365ByUserIdOrderByDateDesc(userId).stream()
                .map(DailyCaloriesEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public DailyEntry save(DailyEntry entry) {
        // Upsert atomique sur (user_id, date) : plus de race "find puis save"
        // ni de retry dans une transaction condamnée.
        jpaRepository.upsert(
                entry.getUserId(),
                entry.getDate(),
                entry.getCaloriesConsumed(),
                entry.getSteps(),
                entry.getCaloriesBurned(),
                entry.isConfirmed()
        );
        return jpaRepository.findByUserIdAndDate(entry.getUserId(), entry.getDate())
                .map(DailyCaloriesEntityMapper::toDomain)
                .orElseThrow(() -> new IllegalStateException(
                        "Entrée journalière introuvable après upsert : userId="
                                + entry.getUserId() + " date=" + entry.getDate()));
    }
}
