package com.nutrition.backend.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name = "objective_completions")
public class ObjectiveCompletionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "objective_id")
    private Long objectiveId;

    @Column(name = "date")
    private LocalDate date;
}
