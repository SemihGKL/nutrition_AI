package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Exception.UserNotFoundException;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.domain.model.Gender;
import com.nutrition.backend.domain.service.MbrCalculator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MbrCalculator mbrCalculator;

    @InjectMocks
    private UserService userService;

    @Test
    void should_calculate_mbr_and_set_daily_goal_when_creating_user() {
        String username = "john";
        String email = "john@mail.fr";
        double startWeight = 80.0;

        com.nutrition.backend.domain.model.Mbr fakeMbr =
                new com.nutrition.backend.domain.model.Mbr(1780.0, 2136.0, 1736.0);
        when(mbrCalculator.calculate(any())).thenReturn(fakeMbr);

        User saved = new User();
        saved.setUsername(username);
        saved.setEmail(email);
        saved.setDailyCalorieGoal(1736);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        User result = userService.createUser(username, email, 75, Gender.MALE, 30, 180.0, startWeight, null);

        assertThat(result.getDailyCalorieGoal()).isEqualTo(1736);
        assertThat(result.getUsername()).isEqualTo(username);
        assertThat(result.getEmail()).isEqualTo(email);
    }

    @Test
    void should_throw_exception_when_user_not_found() {
        Long unknownId = 99L;
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(unknownId))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void should_update_username_and_email_when_both_provided() {
        Long userId = 1L;
        User existing = new User();
        existing.setUsername("old");
        existing.setEmail("old@mail.fr");

        User updated = new User();
        updated.setUsername("new");
        updated.setEmail("new@mail.fr");

        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenReturn(updated);

        User result = userService.updateProfile(userId, Optional.of("new"), Optional.of("new@mail.fr"));

        assertThat(result.getUsername()).isEqualTo("new");
        assertThat(result.getEmail()).isEqualTo("new@mail.fr");
    }

    @Test
    void should_update_only_username_when_email_absent() {
        Long userId = 1L;
        User existing = new User();
        existing.setUsername("old");
        existing.setEmail("same@mail.fr");

        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateProfile(userId, Optional.of("new"), Optional.empty());

        assertThat(result.getUsername()).isEqualTo("new");
        assertThat(result.getEmail()).isEqualTo("same@mail.fr");
    }

    @Test
    void should_update_calorie_goal() {
        Long userId = 1L;
        User existing = new User();
        existing.setDailyCalorieGoal(2000);

        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateCalorieGoal(userId, 1800);

        assertThat(result.getDailyCalorieGoal()).isEqualTo(1800);
    }

    @Test
    void should_recalculate_mbr_when_updating_body_metrics() {
        Long userId = 1L;
        User existing = new User();
        existing.setDailyCalorieGoal(2000);

        com.nutrition.backend.domain.model.Mbr newMbr =
                new com.nutrition.backend.domain.model.Mbr(1700.0, 2040.0, 1640.0);
        when(mbrCalculator.calculate(any())).thenReturn(newMbr);
        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateBodyMetrics(userId, Gender.FEMALE, 28, 165.0, 65.0, null);

        assertThat(result.getDailyCalorieGoal()).isEqualTo(1640);
        assertThat(result.getCurrentWeight()).isEqualTo(65.0);
        assertThat(result.getGender()).isEqualTo("FEMALE");
    }

    @Test
    void should_return_empty_list_when_no_users_exist() {
        when(userRepository.findAll()).thenReturn(List.of());

        List<User> result = userService.getAllUsers();

        assertThat(result).isEmpty();
    }

    @Test
    void should_return_all_users_when_users_exist() {
        User alice = new User();
        alice.setUsername("alice");
        User bob = new User();
        bob.setUsername("bob");
        when(userRepository.findAll()).thenReturn(List.of(alice, bob));

        List<User> result = userService.getAllUsers();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUsername()).isEqualTo("alice");
        assertThat(result.get(1).getUsername()).isEqualTo("bob");
    }

    @Test
    void should_return_user_when_id_exists() {
        Long userId = 1L;
        User expected = new User();
        expected.setUsername("alice");
        expected.setEmail("alice@mail.fr");
        when(userRepository.findById(userId)).thenReturn(Optional.of(expected));

        User result = userService.getUserById(userId);

        assertThat(result.getUsername()).isEqualTo("alice");
        assertThat(result.getEmail()).isEqualTo("alice@mail.fr");
    }

    @Test
    void should_return_user_when_email_exists() {
        String email = "alice@mail.fr";
        User expected = new User();
        expected.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(expected));

        User result = userService.getByEmail(email);

        assertThat(result.getEmail()).isEqualTo(email);
    }

    @Test
    void should_throw_exception_when_email_not_found() {
        String email = "unknown@mail.fr";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByEmail(email))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(email);
    }
}
