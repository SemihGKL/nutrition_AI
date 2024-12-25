package com.nutrition.backend.Repository;

import com.nutrition.backend.Class.DailyCalories;
import com.nutrition.backend.Class.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyCaloriesRepository extends JpaRepository<DailyCalories, Long> {
    List<DailyCalories> findByUserIdAndDate(Long userId, LocalDate date);

    List<DailyCalories> findByUserId(Long userId);
}
