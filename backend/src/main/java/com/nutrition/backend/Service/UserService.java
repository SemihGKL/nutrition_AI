package com.nutrition.backend.Service;

import com.nutrition.backend.Exception.UserNotFoundException;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.MbrCalculator;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final MbrCalculator mbrCalculator;

    public UserService(UserRepository userRepository, MbrCalculator mbrCalculator) {
        this.userRepository = userRepository;
        this.mbrCalculator = mbrCalculator;
    }

    public User createUser(String username, String email, int weightGoal, Gender gender, int age, Double height, double startWeight, String weighInDay) {
        UserProfile profile = new UserProfile(startWeight, height, age, gender);
        int calculatedGoal = (int) mbrCalculator.calculate(profile).dailyCalorieGoal();

        User user = new User(null, username, email, null, gender, age, height,
                startWeight, startWeight, calculatedGoal, weightGoal, weighInDay, null);
        return userRepository.save(user);
    }

    public User updateProfile(Long id, Optional<String> username, Optional<String> email) {
        User user = getUserById(id);
        if (username.isPresent()) {
            user = user.withUsername(username.get());
        }
        if (email.isPresent()) {
            user = user.withEmail(email.get());
        }
        return userRepository.save(user);
    }

    public User updateCalorieGoal(Long id, int dailyCalorieGoal) {
        User user = getUserById(id);
        user = user.withDailyCalorieGoal(dailyCalorieGoal);
        return userRepository.save(user);
    }

    public User updateStepsGoal(Long id, Integer dailyStepsGoal) {
        User user = getUserById(id);
        user = user.withDailyStepsGoal(dailyStepsGoal);
        return userRepository.save(user);
    }

    public User updateBodyMetrics(Long id, Gender gender, int age, Double height, double currentWeight, String weighInDay) {
        User user = getUserById(id);

        UserProfile profile = new UserProfile(currentWeight, height, age, gender);
        int recalculatedGoal = (int) mbrCalculator.calculate(profile).dailyCalorieGoal();

        user = user.withBodyMetrics(gender, age, height, currentWeight, weighInDay)
                   .withDailyCalorieGoal(recalculatedGoal);

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable pour l'email : " + email));
    }
}
