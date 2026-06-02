package com.nutrition.backend.Repository;

import com.nutrition.backend.Class.WeeklyWeighIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WeeklyWeighInRepository extends JpaRepository<WeeklyWeighIn, Long> {

    List<WeeklyWeighIn> findByUserIdOrderByDateDesc(Long userId);
}
