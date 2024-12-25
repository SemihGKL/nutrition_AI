package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Repository.UserRepository;
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
        User userToReturn = new User();
        userToReturn.setUsername(username);
        userToReturn.setEmail(mail);
        when(userRepository.save(any(User.class))).thenReturn(userToReturn);

        //When
        User userCreated = userService.createUser(username, mail);

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


}