package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface MealReminderJpaRepository extends JpaRepository<MealReminderJpaEntity, Long> {

    List<MealReminderJpaEntity> findByUserId(Long userId);

    List<MealReminderJpaEntity> findByEnabledTrueAndReminderTime(LocalTime reminderTime);

    /** Upsert atomique sur (user_id, meal). */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO meal_reminders (user_id, meal, reminder_time, enabled)
            VALUES (:userId, :meal, :time, :enabled)
            ON CONFLICT (user_id, meal) DO UPDATE SET
                reminder_time = EXCLUDED.reminder_time,
                enabled       = EXCLUDED.enabled
            """, nativeQuery = true)
    void upsert(@Param("userId") Long userId,
                @Param("meal") String meal,
                @Param("time") LocalTime time,
                @Param("enabled") boolean enabled);
}
