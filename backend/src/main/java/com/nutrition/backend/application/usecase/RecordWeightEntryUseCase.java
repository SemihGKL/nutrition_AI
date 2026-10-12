package com.nutrition.backend.application.usecase;

import com.nutrition.backend.domain.entity.WeightEntry;
import com.nutrition.backend.domain.ports.UserRepository;
import com.nutrition.backend.domain.ports.WeightEntryRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;

@Component
public class RecordWeightEntryUseCase {

    private final WeightEntryRepository weightEntryRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public RecordWeightEntryUseCase(WeightEntryRepository weightEntryRepository,
                                    UserRepository userRepository,
                                    Clock clock) {
        this.weightEntryRepository = weightEntryRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional
    public WeightEntry execute(WeightEntry entry) {
        // Un jour de tolérance : un utilisateur en avance sur Paris peut déjà être au lendemain.
        if (entry.getDate().isAfter(LocalDate.now(clock).plusDays(1))) {
            throw new IllegalArgumentException("La date de pesée ne peut pas être dans le futur");
        }
        boolean isMostRecent = !weightEntryRepository.existsAfter(entry.getUserId(), entry.getDate());

        WeightEntry saved = weightEntryRepository.save(entry);
        // Une pesée plus ancienne complète l'historique sans changer le poids actuel.
        if (isMostRecent) {
            userRepository.findById(entry.getUserId()).ifPresent(user ->
                    userRepository.save(user.withCurrentWeight(entry.getWeight())));
        }
        return saved;
    }
}
