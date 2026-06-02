package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Exception.UserNotFoundException;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.domain.model.ActivityLevel;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.model.UserProfile;
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

    public User createUser(String username, String email, int weightGoal, Gender gender, int age, Double height, ActivityLevel activityLevel, double startWeight) {
        UserProfile profile = new UserProfile(startWeight, height, age, gender, activityLevel);
        int calculatedGoal = (int) mbrCalculator.calculate(profile).dailyCalorieGoal();

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setWeightGoal(weightGoal);
        user.setDailyCalorieGoal(calculatedGoal);
        user.setAge(age);
        user.setGender(gender.name());
        user.setHeight(height);
        user.setActivityLevel(activityLevel.name());
        user.setStartWeight(startWeight);
        user.setCurrentWeight(startWeight);
        return userRepository.save(user);
    }

    public User updateProfile(Long id, Optional<String> username, Optional<String> email) {
        User user = getUserById(id);
        username.ifPresent(user::setUsername);
        email.ifPresent(user::setEmail);
        return userRepository.save(user);
    }

    public User updateCalorieGoal(Long id, int dailyCalorieGoal) {
        User user = getUserById(id);
        user.setDailyCalorieGoal(dailyCalorieGoal);
        return userRepository.save(user);
    }

    public User updateBodyMetrics(Long id, Gender gender, int age, Double height, ActivityLevel activityLevel, double currentWeight) {
        User user = getUserById(id);
        user.setGender(gender.name());
        user.setAge(age);
        user.setHeight(height);
        user.setActivityLevel(activityLevel.name());
        user.setCurrentWeight(currentWeight);

        UserProfile profile = new UserProfile(currentWeight, height, age, gender, activityLevel);
        int recalculatedGoal = (int) mbrCalculator.calculate(profile).dailyCalorieGoal();
        user.setDailyCalorieGoal(recalculatedGoal);

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + id));
    }

}
