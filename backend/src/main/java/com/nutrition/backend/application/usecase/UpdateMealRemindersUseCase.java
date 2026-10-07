package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.ports.MealReminderRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UpdateMealRemindersUseCase {

    private final MealReminderRepository mealReminderRepository;

    public UpdateMealRemindersUseCase(MealReminderRepository mealReminderRepository) {
        this.mealReminderRepository = mealReminderRepository;
    }

    public List<MealReminder> execute(Long userId, List<MealReminder> reminders) {
        // Les réglages appartiennent toujours à l'utilisateur authentifié.
        mealReminderRepository.saveAll(userId, reminders.stream().map(r -> r.forUser(userId)).toList());
        return new GetMealRemindersUseCase(mealReminderRepository).execute(userId);
    }
}
