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
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "calories_consumed")
    private int caloriesConsumed;

    @Column(name = "is_confirmed")
    private boolean isConfirmed;


    @Column(name = "steps")
    private int steps;

    @Column(name = "calories_burned")
    private int caloriesBurned;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
