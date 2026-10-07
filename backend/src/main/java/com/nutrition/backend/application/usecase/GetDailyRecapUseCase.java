package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import com.nutrition.backend.domain.service.BodyWeightHistory;
import com.nutrition.backend.domain.service.MbrCalculator;
import com.nutrition.backend.domain.service.StepsCalculator;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class GetDailyRecapUseCase {

    private final DailyEntryRepository dailyEntryRepository;
    private final UserRepository userRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final MbrCalculator mbrCalculator;

    public GetDailyRecapUseCase(DailyEntryRepository dailyEntryRepository,
                                UserRepository userRepository,
                                WeightEntryRepository weightEntryRepository,
                                MbrCalculator mbrCalculator) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.userRepository = userRepository;
        this.weightEntryRepository = weightEntryRepository;
        this.mbrCalculator = mbrCalculator;
    }

    public DailyRecapResult execute(Long userId, LocalDate date) {
        DailyEntry entry = dailyEntryRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new DailyCaloriesNotFoundException(
                        "No daily calories entry found for userId=" + userId + " on " + date));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found for id: " + userId));

        // Poids de ce jour-là : le récap d'un jour passé ne bouge pas à chaque pesée.
        double weightOnDate = BodyWeightHistory.weightOn(date,
                weightEntryRepository.findByUserIdOrderByDateDesc(userId),
                user.getStartWeight(), user.getCurrentWeight());

        UserProfile profile = new UserProfile(
                weightOnDate,
                user.getHeight(),
                user.getAge(),
                user.getGender()
        );

        Mbr mbr = mbrCalculator.calculate(profile);

        int stepsKcal = StepsCalculator.toKcal(entry.getSteps(), weightOnDate);
        int netCalories = entry.getCaloriesConsumed() - entry.getCaloriesBurned() - stepsKcal;
        double deficit = mbr.tdee() - netCalories;
        double deficitPercentage = mbr.deficitPercentage(netCalories);

        return new DailyRecapResult(
                entry.getDate(),
                entry.getCaloriesConsumed(),
                entry.getCaloriesBurned(),
                entry.getSteps(),
                stepsKcal,
                netCalories,
                user.getDailyCalorieGoal(),
                mbr.mbr(),
                mbr.tdee(),
                deficit,
                deficitPercentage,
                entry.isConfirmed()
        );
    }
}
