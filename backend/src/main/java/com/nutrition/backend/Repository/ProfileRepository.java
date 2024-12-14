package com.nutrition.backend.Repository;

import com.nutrition.backend.Class.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

}
