package com.nutrition.backend.Service;

import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Repository.WeeklyWeighInRepository;
import com.nutrition.backend.infrastructure.persistence.UserJpaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WeeklyWeighInService {

    private final WeeklyWeighInRepository weeklyWeighInRepository;
    private final UserJpaRepository userJpaRepository;

    public WeeklyWeighInService(WeeklyWeighInRepository weeklyWeighInRepository, UserJpaRepository userJpaRepository) {
        this.weeklyWeighInRepository = weeklyWeighInRepository;
        this.userJpaRepository = userJpaRepository;
    }

    public WeeklyWeighIn saveWeighIn(WeeklyWeighIn weighIn) {
        weighIn.getUser().setCurrentWeight(weighIn.getWeight());
        userJpaRepository.save(weighIn.getUser());
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
