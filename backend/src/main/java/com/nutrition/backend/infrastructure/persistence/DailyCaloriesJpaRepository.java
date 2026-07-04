package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyCaloriesJpaRepository extends JpaRepository<DailyCaloriesJpaEntity, Long> {

    Optional<DailyCaloriesJpaEntity> findByUserIdAndDate(Long userId, LocalDate date);

    List<DailyCaloriesJpaEntity> findTop365ByUserIdOrderByDateDesc(Long userId);

    /**
     * Upsert atomique sur la clé naturelle (user_id, date). Élimine la course
     * "find puis save" : deux écritures concurrentes sur le même jour ne lèvent plus
     * de violation de contrainte, la dernière écrasant les valeurs (mêmes sémantiques
     * que l'ancien merge où l'entrée entrante gagne).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO daily_calories (user_id, date, calories_consumed, steps, calories_burned, is_confirmed)
            VALUES (:userId, :date, :caloriesConsumed, :steps, :caloriesBurned, :confirmed)
            ON CONFLICT (user_id, date) DO UPDATE SET
                calories_consumed = EXCLUDED.calories_consumed,
                steps             = EXCLUDED.steps,
                calories_burned   = EXCLUDED.calories_burned,
                is_confirmed      = EXCLUDED.is_confirmed
            """, nativeQuery = true)
    void upsert(@Param("userId") Long userId,
                @Param("date") LocalDate date,
                @Param("caloriesConsumed") int caloriesConsumed,
                @Param("steps") int steps,
                @Param("caloriesBurned") int caloriesBurned,
                @Param("confirmed") boolean confirmed);
}
