package com.nutrition.backend.infrastructure.persistence;

import com.nutrition.backend.domain.model.MealType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Getter
@Setter
@Table(name = "meal_reminders")
public class MealReminderJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal")
    private MealType meal;

    @Column(name = "reminder_time")
    private LocalTime reminderTime;

    @Column(name = "enabled")
    private boolean enabled;
}
