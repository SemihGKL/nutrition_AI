package com.nutrition.backend.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionJpaRepository extends JpaRepository<PushSubscriptionJpaEntity, Long> {

    Optional<PushSubscriptionJpaEntity> findByEndpoint(String endpoint);

    @Modifying
    void deleteByEndpoint(String endpoint);

    @Query(value = """
            SELECT ps.* FROM push_subscriptions ps
            JOIN users u ON u.id = ps.user_id
            WHERE u.weigh_in_day = :dayOfWeek
              AND u.id NOT IN (
                  SELECT w.user_id FROM weekly_weigh_in w
                  WHERE w.date >= CAST(:weekStart AS DATE)
              )
            """, nativeQuery = true)
    List<PushSubscriptionJpaEntity> findPendingWeighInReminders(
            @Param("dayOfWeek") String dayOfWeek,
            @Param("weekStart") String weekStart);
}
