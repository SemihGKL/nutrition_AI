package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.domain.model.ActivityLevel;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.MbrCalculator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void should_create_user() {
        //Given
        String mail = "jhon@mail.fr";
        String username = "jhon";
        int weightGoal = 90;
        int dailyKcalGoal = 2300;
        User userToReturn = new User();
        userToReturn.setUsername(username);
        userToReturn.setEmail(mail);
        when(userRepository.save(any(User.class))).thenReturn(userToReturn);

        //When
        User userCreated = userService.createUser(username, mail, weightGoal, dailyKcalGoal, "MALE", 30, 180.0, "SEDENTARY");

        //Then
        assertEquals(username, userCreated.getUsername());
        assertEquals(mail, userCreated.getEmail());
    }

    @Test
    public void should_update_user_name_and_email() {

    }

    @Test
    public void should_update_user_kcalGoal() {

    }

    @Test
    public void should_update_user_global_informations() {

    }

    @Test
    public void should_calculate_daily_calorie_goal_when_creating_user() {
        // Given
        // weight=80kg, height=180cm, age=30, MALE, SEDENTARY
        // MBR = 1780, TDEE = 2136.0, dailyCalorieGoal = 2136.0 - 400 = 1736.0
        String username = "john";
        String email = "john@mail.fr";
        int weightGoal = 75;
        double startWeight = 80.0;

        User userToReturn = new User();
        userToReturn.setUsername(username);
        userToReturn.setEmail(email);
        userToReturn.setDailyCalorieGoal(1736);
        when(userRepository.save(any(User.class))).thenReturn(userToReturn);

        // When
        User result = userService.createUser(username, email, weightGoal, Gender.MALE, 30, 180.0, ActivityLevel.SEDENTARY, startWeight);

        // Then
        assertEquals(1736, result.getDailyCalorieGoal());
    }


}