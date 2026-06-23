package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.ports.PasswordEncoderPort;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.MbrCalculator;
import org.springframework.stereotype.Component;

@Component
public class RegisterUserUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final MbrCalculator mbrCalculator;

    public RegisterUserUseCase(UserRepository userRepository,
                                PasswordEncoderPort passwordEncoder,
                                MbrCalculator mbrCalculator) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mbrCalculator = mbrCalculator;
    }

    public User execute(String username, String email, String rawPassword,
                        int weightGoal, Gender gender, int age,
                        double height, double startWeight, String weighInDay) {
        UserProfile profile = new UserProfile(startWeight, height, age, gender);
        int calculatedGoal = (int) mbrCalculator.calculate(profile).dailyCalorieGoal();
        String passwordHash = passwordEncoder.encode(rawPassword);

        User user = new User(null, username, email, passwordHash,
                gender, age, height, startWeight, startWeight,
                calculatedGoal, weightGoal, weighInDay, null);
        return userRepository.save(user);
    }
}
