package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.web.dto.CreateUserRequest;
import com.nutrition.backend.web.dto.UpdateUserRequest;
import com.nutrition.backend.web.dto.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());

        User user = userService.createUser(
                request.username(),
                request.email(),
                request.weightGoal(),
                gender,
                request.age(),
                request.height(),
                request.startWeight(),
                request.weighInDay()
        );
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        Gender gender = Gender.valueOf(request.gender().toUpperCase());
        userService.updateBodyMetrics(id, gender, request.age(), request.height(), request.currentWeight(), request.weighInDay());
        userService.updateProfile(id, java.util.Optional.of(request.username()), java.util.Optional.empty());
        if (request.dailyCalorieGoal() != null) {
            userService.updateCalorieGoal(id, request.dailyCalorieGoal());
        }
        User updated = userService.getUserById(id);
        return ResponseEntity.ok(toDto(updated));
    }

    private UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDailyCalorieGoal(),
                user.getWeightGoal(),
                user.getGender(),
                user.getAge(),
                user.getHeight(),
                user.getStartWeight(),
                user.getCurrentWeight(),
                user.getWeighInDay()
        );
    }
}
