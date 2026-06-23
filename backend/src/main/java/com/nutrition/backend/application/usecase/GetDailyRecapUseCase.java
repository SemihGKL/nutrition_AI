package com.nutrition.backend.application.usecase;

import com.nutrition.backend.Exception.DailyCaloriesNotFoundException;
import com.nutrition.backend.domain.entity.DailyEntry;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.model.Mbr;
import com.nutrition.backend.domain.model.UserProfile;
import com.nutrition.backend.domain.ports.DailyEntryRepository;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.service.MbrCalculator;
import com.nutrition.backend.domain.service.StepsCalculator;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class GetDailyRecapUseCase {

    private final DailyEntryRepository dailyEntryRepository;
    private final UserRepository userRepository;
    private final MbrCalculator mbrCalculator;

    public GetDailyRecapUseCase(DailyEntryRepository dailyEntryRepository,
                                UserRepository userRepository,
                                MbrCalculator mbrCalculator) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.userRepository = userRepository;
        this.mbrCalculator = mbrCalculator;
    }

    public DailyRecapResponse execute(Long userId, LocalDate date) {
        DailyEntry entry = dailyEntryRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new DailyCaloriesNotFoundException(
                        "No daily calories entry found for userId=" + userId + " on " + date));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found for id: " + userId));

        UserProfile profile = new UserProfile(
                user.getCurrentWeight(),
                user.getHeight(),
                user.getAge(),
                user.getGender()
        );

        Mbr mbr = mbrCalculator.calculate(profile);

        int stepsKcal = StepsCalculator.toKcal(entry.getSteps(), user.getCurrentWeight());
        int netCalories = entry.getCaloriesConsumed() - entry.getCaloriesBurned() - stepsKcal;
        double deficit = mbr.tdee() - netCalories;
        double deficitPercentage = mbr.deficitPercentage(netCalories);

        return new DailyRecapResponse(
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
