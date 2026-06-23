package com.nutrition.backend.Service;

import com.nutrition.backend.application.usecase.LoginUserUseCase;
import com.nutrition.backend.application.usecase.RegisterUserUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.ports.TokenService;
import com.nutrition.backend.web.UserMapper;
import com.nutrition.backend.web.dto.AuthResponse;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUserUseCase loginUserUseCase;
    private final TokenService tokenService;

    public AuthService(RegisterUserUseCase registerUserUseCase,
                       LoginUserUseCase loginUserUseCase,
                       TokenService tokenService) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUserUseCase = loginUserUseCase;
        this.tokenService = tokenService;
    }

    public AuthResponse register(String username, String email, String rawPassword,
                                  int weightGoal, Gender gender, int age,
                                  Double height, double startWeight, String weighInDay) {
        User user = registerUserUseCase.execute(username, email, rawPassword,
                weightGoal, gender, age, height, startWeight, weighInDay);
        String token = tokenService.generateToken(user.getEmail());
        return new AuthResponse(token, UserMapper.toDto(user));
    }

    public AuthResponse login(String email, String rawPassword) {
        User user = loginUserUseCase.execute(email, rawPassword);
        String token = tokenService.generateToken(user.getEmail());
        return new AuthResponse(token, UserMapper.toDto(user));
    }
}
