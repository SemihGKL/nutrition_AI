package com.nutrition.backend.Service;

import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Repository.UserRepository;
import com.nutrition.backend.Repository.WeeklyWeighInRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WeeklyWeighInService {

    private final WeeklyWeighInRepository weeklyWeighInRepository;
    private final UserRepository userRepository;

    public WeeklyWeighInService(WeeklyWeighInRepository weeklyWeighInRepository, UserRepository userRepository) {
        this.weeklyWeighInRepository = weeklyWeighInRepository;
        this.userRepository = userRepository;
    }

    public WeeklyWeighIn saveWeighIn(WeeklyWeighIn weighIn) {
        weighIn.getUser().setCurrentWeight(weighIn.getWeight());
        userRepository.save(weighIn.getUser());
        return weeklyWeighInRepository.save(weighIn);
    }

    public List<WeeklyWeighIn> getAllByUser(Long userId) {
        return weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Optional<WeeklyWeighIn> getLatestByUser(Long userId) {
        List<WeeklyWeighIn> weighIns = weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId);
        if (weighIns.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(weighIns.get(0));
    }
}
