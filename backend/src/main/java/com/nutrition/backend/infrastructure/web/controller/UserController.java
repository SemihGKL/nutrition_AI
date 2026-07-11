package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.UpdateUserProfileUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.infrastructure.web.UserMapper;
import com.nutrition.backend.infrastructure.web.dto.UpdateUserRequest;
import com.nutrition.backend.infrastructure.web.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final GetUserProfileUseCase getUserProfileUseCase;
    private final UpdateUserProfileUseCase updateUserProfileUseCase;

    public UserController(GetUserProfileUseCase getUserProfileUseCase,
                          UpdateUserProfileUseCase updateUserProfileUseCase) {
        this.getUserProfileUseCase = getUserProfileUseCase;
        this.updateUserProfileUseCase = updateUserProfileUseCase;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile(Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        return ResponseEntity.ok(UserMapper.toDto(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMyProfile(@Valid @RequestBody UpdateUserRequest request, Authentication auth) {
        User current = getUserProfileUseCase.byEmail(auth.getName());
        Gender gender = Gender.valueOf(request.gender().toUpperCase());

        // Email volontairement immuable via ce endpoint : le sujet du JWT étant l'email,
        // le changer ici casserait la session (byEmail → 404). On passe null → conservé.
        User updated = updateUserProfileUseCase.execute(
                current.getId(),
                request.username(),
                null,
                gender,
                request.age(),
                request.height(),
                request.currentWeight(),
                request.weighInDay(),
                request.dailyCalorieGoal(),
                request.dailyStepsGoal(),
                request.weightGoal()
        );
        return ResponseEntity.ok(UserMapper.toDto(updated));
    }
}
