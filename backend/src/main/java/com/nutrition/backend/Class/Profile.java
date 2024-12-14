package com.nutrition.backend.Class;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int calorieGoal;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
