package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.GetMealRemindersUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.UpdateMealRemindersUseCase;
import com.nutrition.backend.domain.entity.MealReminder;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.infrastructure.web.dto.MealReminderDto;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-reminders")
public class MealReminderController {

    private final GetUserProfileUseCase getUserProfileUseCase;
    private final GetMealRemindersUseCase getMealRemindersUseCase;
    private final UpdateMealRemindersUseCase updateMealRemindersUseCase;

    public MealReminderController(GetUserProfileUseCase getUserProfileUseCase,
                                  GetMealRemindersUseCase getMealRemindersUseCase,
                                  UpdateMealRemindersUseCase updateMealRemindersUseCase) {
        this.getUserProfileUseCase = getUserProfileUseCase;
        this.getMealRemindersUseCase = getMealRemindersUseCase;
        this.updateMealRemindersUseCase = updateMealRemindersUseCase;
    }

    @GetMapping
    public List<MealReminderDto> getMine(Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        return toDtos(getMealRemindersUseCase.execute(user.getId()));
    }

    @PutMapping
    public List<MealReminderDto> updateMine(@RequestBody List<@Valid MealReminderDto> request, Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        List<MealReminder> reminders = request.stream()
                .map(d -> new MealReminder(user.getId(), d.meal(), d.time(), d.enabled()))
                .toList();
        return toDtos(updateMealRemindersUseCase.execute(user.getId(), reminders));
    }

    private static List<MealReminderDto> toDtos(List<MealReminder> reminders) {
        return reminders.stream().map(r -> new MealReminderDto(r.meal(), r.time(), r.enabled())).toList();
    }
}
