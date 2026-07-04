package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyWeighInJpaRepository extends JpaRepository<WeeklyWeighInJpaEntity, Long> {
    List<WeeklyWeighInJpaEntity> findTop104ByUserIdOrderByDateDesc(Long userId);

    Optional<WeeklyWeighInJpaEntity> findByUserIdAndDate(Long userId, LocalDate date);

    /** Upsert atomique sur (user_id, date) : la re-pesée du même jour met à jour au lieu de dupliquer. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO weekly_weigh_in (user_id, date, weight, note)
            VALUES (:userId, :date, :weight, :note)
            ON CONFLICT (user_id, date) DO UPDATE SET
                weight = EXCLUDED.weight,
                note   = EXCLUDED.note
            """, nativeQuery = true)
    void upsert(@Param("userId") Long userId,
                @Param("date") LocalDate date,
                @Param("weight") double weight,
                @Param("note") String note);
}
