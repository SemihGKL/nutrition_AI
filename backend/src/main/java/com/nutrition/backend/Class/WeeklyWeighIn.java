package com.nutrition.backend.Class;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name = "weekly_weigh_in")
public class WeeklyWeighIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "weight", nullable = false)
    private double weight;

    @Column(name = "note")
    private String note;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
