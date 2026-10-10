package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.model.MealType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface MealReminderJpaRepository extends JpaRepository<MealReminderJpaEntity, Long> {

    List<MealReminderJpaEntity> findByUserId(Long userId);

    @Query("""
            SELECT r FROM MealReminderJpaEntity r
            WHERE r.enabled = true
              AND r.reminderTime BETWEEN :from AND :to
              AND (r.lastSentOn IS NULL OR r.lastSentOn < :day)
            """)
    List<MealReminderJpaEntity> findDueBetween(@Param("from") LocalTime from,
                                               @Param("to") LocalTime to,
                                               @Param("day") LocalDate day);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE MealReminderJpaEntity r SET r.lastSentOn = :day WHERE r.userId = :userId AND r.meal = :meal")
    void markSent(@Param("userId") Long userId, @Param("meal") MealType meal, @Param("day") LocalDate day);

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
