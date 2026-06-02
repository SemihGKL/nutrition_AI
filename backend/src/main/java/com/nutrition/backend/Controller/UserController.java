package com.nutrition.backend.Controller;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Map<String, String> request) {

        String username = request.get("username");
        String email = request.get("email");
        int weightGoal = 0;
        int dailyCalorieGoal = 0;
        int age = 0;
        double height = 0;
        String gender = request.get("gender");
        String activityLevel = request.get("activityLevel");

        try {
            weightGoal = Integer.parseInt(request.get("weightGoal"));
            dailyCalorieGoal = Integer.parseInt(request.get("dailyCalorieGoal"));
            age = Integer.parseInt(request.get("age"));
            height = Double.parseDouble(request.get("height"));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(null);  // Retourner une erreur si la conversion échoue
        }

        User user = userService.createUser(username, email, weightGoal, dailyCalorieGoal, gender, age, height, activityLevel);

        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers(); // Appel du service pour récupérer la liste des utilisateurs
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
}
