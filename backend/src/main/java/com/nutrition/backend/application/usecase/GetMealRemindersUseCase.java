package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.model.MealType;
import com.nutrition.backend.domain.ports.MealReminderRepository;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class GetMealRemindersUseCase {

    private final MealReminderRepository mealReminderRepository;

    public GetMealRemindersUseCase(MealReminderRepository mealReminderRepository) {
        this.mealReminderRepository = mealReminderRepository;
    }

    /** Les 4 repas, dans l'ordre de la journée ; un repas jamais réglé prend son réglage par défaut. */
    public List<MealReminder> execute(Long userId) {
        List<MealReminder> stored = mealReminderRepository.findByUserId(userId);
        return Arrays.stream(MealType.values())
                .map(meal -> stored.stream()
                        .filter(r -> r.meal() == meal)
                        .findFirst()
                        .orElseGet(() -> MealReminder.defaultFor(userId, meal)))
                .toList();
    }
}
