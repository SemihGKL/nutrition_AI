package com.nutrition.backend.Repository;

import com.nutrition.backend.Class.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

}
