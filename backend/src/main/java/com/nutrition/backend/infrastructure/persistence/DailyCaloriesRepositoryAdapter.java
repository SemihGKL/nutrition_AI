package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class DailyCaloriesRepositoryAdapter implements DailyEntryRepository {

    private final DailyCaloriesJpaRepository jpaRepository;
    private final UserJpaRepository userJpaRepository;

    public DailyCaloriesRepositoryAdapter(DailyCaloriesJpaRepository jpaRepository,
                                          UserJpaRepository userJpaRepository) {
        this.jpaRepository = jpaRepository;
        this.userJpaRepository = userJpaRepository;
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
        UserJpaEntity userJpaEntity = userJpaRepository.findById(entry.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "User JPA entity not found for id: " + entry.getUserId()));

        Optional<DailyCaloriesJpaEntity> existing =
                jpaRepository.findByUserIdAndDate(entry.getUserId(), entry.getDate());

        DailyCaloriesJpaEntity entityToSave;
        if (existing.isPresent()) {
            DailyEntry merged = DailyEntry.merge(
                    DailyCaloriesEntityMapper.toDomain(existing.get()),
                    entry
            );
            entityToSave = DailyCaloriesEntityMapper.toJpaEntity(merged, userJpaEntity);
            entityToSave.setId(existing.get().getId());
        } else {
            entityToSave = DailyCaloriesEntityMapper.toJpaEntity(entry, userJpaEntity);
        }

        try {
            DailyCaloriesJpaEntity saved = jpaRepository.save(entityToSave);
            return DailyCaloriesEntityMapper.toDomain(saved);
        } catch (DataIntegrityViolationException e) {
            // Race condition : une autre requête a inséré le même (userId, date) entre le find et le save
            DailyCaloriesJpaEntity concurrent = jpaRepository.findByUserIdAndDate(entry.getUserId(), entry.getDate())
                    .orElseThrow(() -> new IllegalStateException("Race condition: insert failed but entry not found"));
            DailyEntry merged = DailyEntry.merge(DailyCaloriesEntityMapper.toDomain(concurrent), entry);
            DailyCaloriesJpaEntity entityMerged = DailyCaloriesEntityMapper.toJpaEntity(merged, userJpaEntity);
            entityMerged.setId(concurrent.getId());
            return DailyCaloriesEntityMapper.toDomain(jpaRepository.save(entityMerged));
        }
    }
}
