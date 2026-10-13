package com.nutrition.backend.domain.ports;

import com.nutrition.backend.domain.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    /**
     * Recherche insensible à la casse (des comptes anciens peuvent contenir des majuscules) ;
     * deux comptes ne peuvent pas différer que par la casse.
     */
    Optional<User> findByEmail(String email);
    List<User> findAll();
}
