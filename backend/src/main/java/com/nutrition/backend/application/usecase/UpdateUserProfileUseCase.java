package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.MbrCalculator;
import com.nutrition.backend.domain.exception.UserNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class UpdateUserProfileUseCase {

    private final UserRepository userRepository;
    private final MbrCalculator mbrCalculator;

    public UpdateUserProfileUseCase(UserRepository userRepository, MbrCalculator mbrCalculator) {
        this.userRepository = userRepository;
        this.mbrCalculator = mbrCalculator;
    }

    public User execute(Long id, String username, String email, Gender gender,
                        int age, double height, double currentWeight,
                        String weighInDay, Integer dailyCalorieGoal, Integer dailyStepsGoal,
                        Integer weightGoal) {
        if (height <= 0) {
            throw new IllegalArgumentException("La taille doit être supérieure à 0");
        }
        if (currentWeight <= 0) {
            throw new IllegalArgumentException("Le poids courant doit être supérieur à 0");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + id));

        UserProfile profile = new UserProfile(currentWeight, height, age, gender);
        int recalculatedGoal = (int) mbrCalculator.calculate(profile).dailyCalorieGoal();

        user = user.withBodyMetrics(gender, age, height, currentWeight, weighInDay)
                   .withUsername(username)
                   .withDailyCalorieGoal(dailyCalorieGoal != null ? dailyCalorieGoal : recalculatedGoal);

        if (email != null) {
            user = user.withEmail(email);
        }
        if (dailyStepsGoal != null) {
            user = user.withDailyStepsGoal(dailyStepsGoal);
        }
        if (weightGoal != null) {
            user = user.withWeightGoal(weightGoal);
        }

        return userRepository.save(user);
    }
}
