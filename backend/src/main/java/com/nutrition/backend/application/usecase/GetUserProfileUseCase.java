package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.exception.UserNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class GetUserProfileUseCase {

    private final UserRepository userRepository;

    public GetUserProfileUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User byEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable pour l'email : " + email));
    }

    public User byId(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable avec l'ID : " + id));
    }
}
