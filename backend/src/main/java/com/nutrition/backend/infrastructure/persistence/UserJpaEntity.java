package com.nutrition.backend.infrastructure.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "users")
public class UserJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "version")
    private Long version;

    @NotNull
    @Column(name = "username", nullable = false)
    private String username;

    @NotNull(message = "Le mail est obligatoire")
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "daily_calorie_goal")
    private int dailyCalorieGoal;

    @Column(name = "weight_goal")
    private int weightGoal;

    @NotNull(message = "Le genre est obligatoire")
    @Column(name = "gender", nullable = false)
    private String gender;

    @NotNull(message = "L'age est obligatoire")
    @Column(name = "age", nullable = false)
    private int age;

    @NotNull(message = "La taille est obligatoire")
    @Column(name = "height", nullable = false)
    private double height;

    @Column(name = "start_weight")
    private double startWeight;

    @Column(name = "current_weight")
    private double currentWeight;

    @JsonIgnore
    @Column(name = "password")
    private String password;

    @Column(name = "weigh_in_day")
    private String weighInDay;

    @Column(name = "daily_steps_goal")
    private Integer dailyStepsGoal;
}
