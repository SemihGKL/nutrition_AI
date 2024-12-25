package com.nutrition.backend.Class;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name = "daily_calories")
public class DailyCalories {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private int caloriesConsumed;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
