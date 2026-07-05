package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RecordWeightEntryUseCase {

    private final WeightEntryRepository weightEntryRepository;
    private final UserRepository userRepository;

    public RecordWeightEntryUseCase(WeightEntryRepository weightEntryRepository,
                                    UserRepository userRepository) {
        this.weightEntryRepository = weightEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WeightEntry execute(WeightEntry entry) {
        WeightEntry saved = weightEntryRepository.save(entry);
        userRepository.findById(entry.getUserId()).ifPresent(user -> {
            User updated = user.withCurrentWeight(entry.getWeight());
            userRepository.save(updated);
        });
        return saved;
    }
}
