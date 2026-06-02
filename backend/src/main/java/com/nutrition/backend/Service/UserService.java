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

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(String username, String email, int weightGoal, int dailyCalorieGoal, String gender, int age, Double height, String activityLevel) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setWeightGoal(weightGoal);
        user.setDailyCalorieGoal(dailyCalorieGoal);
        user.setAge(age);
        user.setGender(gender);
        user.setHeight(height);
        user.setActivityLevel(activityLevel);
        return userRepository.save(user);
    }

    public User createUser(String username, String email, int weightGoal, Gender gender, int age, Double height, ActivityLevel activityLevel, double startWeight) {
        UserProfile profile = new UserProfile(startWeight, height, age, gender, activityLevel);
        MbrCalculator calculator = new MbrCalculator();
        int calculatedGoal = (int) calculator.calculate(profile).dailyCalorieGoal();

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

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + id));
    }

}
