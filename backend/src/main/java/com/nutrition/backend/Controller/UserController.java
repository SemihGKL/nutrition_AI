package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Service.UserService;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.web.UserMapper;
import com.nutrition.backend.web.dto.UpdateUserRequest;
import com.nutrition.backend.web.dto.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile(Authentication auth) {
        User user = userService.getByEmail(auth.getName());
        return ResponseEntity.ok(UserMapper.toDto(user));
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<UserDto> updateMyProfile(@RequestBody UpdateUserRequest request, Authentication auth) {
        User current = userService.getByEmail(auth.getName());
        Gender gender = Gender.valueOf(request.gender().toUpperCase());

        userService.updateBodyMetrics(current.getId(), gender, request.age(), request.height(), request.currentWeight(), request.weighInDay());
        userService.updateProfile(current.getId(), Optional.of(request.username()), Optional.ofNullable(request.email()));

        if (request.dailyCalorieGoal() != null) {
            userService.updateCalorieGoal(current.getId(), request.dailyCalorieGoal());
        }

        return ResponseEntity.ok(UserMapper.toDto(userService.getUserById(current.getId())));
    }
}
