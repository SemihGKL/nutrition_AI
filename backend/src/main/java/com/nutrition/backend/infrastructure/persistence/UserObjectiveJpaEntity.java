package com.nutrition.backend.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "user_objectives")
public class UserObjectiveJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "day_of_week")
    private int dayOfWeek;

    @Column(name = "label")
    private String label;

    @Column(name = "position")
    private int position;

    @Column(name = "type", nullable = false)
    private String type = "CUSTOM";

    @Column(name = "target_value")
    private Integer targetValue;
}
