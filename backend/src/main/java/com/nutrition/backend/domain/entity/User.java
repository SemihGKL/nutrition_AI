package com.nutrition.backend.domain.entity;

import com.nutrition.backend.domain.model.Gender;

public final class User {
    private final Long id;
    private final String username;
    private final String email;
    private final String passwordHash;
    private final Gender gender;
    private final int age;
    private final double height;
    private final double startWeight;
    private final double currentWeight;
    private final int dailyCalorieGoal;
    private final int weightGoal;
    private final String weighInDay;
    private final Integer dailyStepsGoal;
    // Version de verrouillage optimiste (null pour un nouvel utilisateur non encore persisté).
    private final Long version;

    public User(Long id, String username, String email, String passwordHash,
                Gender gender, int age, double height,
                double startWeight, double currentWeight,
                int dailyCalorieGoal, int weightGoal,
                String weighInDay, Integer dailyStepsGoal) {
        this(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal,
                weighInDay, dailyStepsGoal, null);
    }

    public User(Long id, String username, String email, String passwordHash,
                Gender gender, int age, double height,
                double startWeight, double currentWeight,
                int dailyCalorieGoal, int weightGoal,
                String weighInDay, Integer dailyStepsGoal, Long version) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.gender = gender;
        this.age = age;
        this.height = height;
        this.startWeight = startWeight;
        this.currentWeight = currentWeight;
        this.dailyCalorieGoal = dailyCalorieGoal;
        this.weightGoal = weightGoal;
        this.weighInDay = weighInDay;
        this.dailyStepsGoal = dailyStepsGoal;
        this.version = version;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Gender getGender() { return gender; }
    public int getAge() { return age; }
    public double getHeight() { return height; }
    public double getStartWeight() { return startWeight; }
    public double getCurrentWeight() { return currentWeight; }
    public int getDailyCalorieGoal() { return dailyCalorieGoal; }
    public int getWeightGoal() { return weightGoal; }
    public String getWeighInDay() { return weighInDay; }
    public Integer getDailyStepsGoal() { return dailyStepsGoal; }
    public Long getVersion() { return version; }

    public User withUsername(String username) {
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, weighInDay, dailyStepsGoal, version);
    }

    public User withEmail(String email) {
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, weighInDay, dailyStepsGoal, version);
    }

    public User withPasswordHash(String passwordHash) {
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, weighInDay, dailyStepsGoal, version);
    }

    public User withDailyCalorieGoal(int dailyCalorieGoal) {
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, weighInDay, dailyStepsGoal, version);
    }

    public User withDailyStepsGoal(Integer dailyStepsGoal) {
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, weighInDay, dailyStepsGoal, version);
    }

    public User withBodyMetrics(Gender gender, int age, double height, double currentWeight, String weighInDay) {
        String effectiveWeighInDay = weighInDay != null ? weighInDay : this.weighInDay;
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, effectiveWeighInDay, dailyStepsGoal, version);
    }

    public User withCurrentWeight(double currentWeight) {
        return new User(id, username, email, passwordHash, gender, age, height,
                startWeight, currentWeight, dailyCalorieGoal, weightGoal, weighInDay, dailyStepsGoal, version);
    }
}
