package com.nutrition.backend.Service;

import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Repository.WeeklyWeighInRepository;
import com.nutrition.backend.infrastructure.persistence.UserJpaRepository;
import com.nutrition.backend.infrastructure.persistence.UserJpaEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WeeklyWeighInServiceTest {

    @Mock
    private WeeklyWeighInRepository weeklyWeighInRepository;

    @Mock
    private UserJpaRepository userJpaRepository;

    @InjectMocks
    private WeeklyWeighInService weeklyWeighInService;

    private UserJpaEntity userJpaEntity(double currentWeight) {
        UserJpaEntity entity = new UserJpaEntity();
        entity.setId(1L);
        entity.setUsername("john");
        entity.setCurrentWeight(currentWeight);
        return entity;
    }

    @Test
    public void should_save_weighin_when_valid_data() {
        UserJpaEntity user = userJpaEntity(82.0);

        WeeklyWeighIn weighIn = new WeeklyWeighIn();
        weighIn.setDate(LocalDate.of(2024, 1, 15));
        weighIn.setWeight(80.5);
        weighIn.setUser(user);

        when(weeklyWeighInRepository.save(any(WeeklyWeighIn.class))).thenReturn(weighIn);

        WeeklyWeighIn result = weeklyWeighInService.saveWeighIn(weighIn);

        assertEquals(80.5, result.getWeight());
        assertEquals(LocalDate.of(2024, 1, 15), result.getDate());
    }

    @Test
    public void should_update_user_current_weight_when_saving_weigh_in() {
        UserJpaEntity user = userJpaEntity(82.0);

        WeeklyWeighIn weighIn = new WeeklyWeighIn();
        weighIn.setWeight(80.5);
        weighIn.setUser(user);

        when(weeklyWeighInRepository.save(any())).thenReturn(weighIn);

        weeklyWeighInService.saveWeighIn(weighIn);

        assertThat(user.getCurrentWeight()).isEqualTo(80.5);
        verify(userJpaRepository).save(user);
    }

    @Test
    public void should_persist_user_before_weigh_in_when_saving() {
        UserJpaEntity user = userJpaEntity(82.0);

        WeeklyWeighIn weighIn = new WeeklyWeighIn();
        weighIn.setWeight(79.0);
        weighIn.setUser(user);

        when(weeklyWeighInRepository.save(any())).thenReturn(weighIn);

        weeklyWeighInService.saveWeighIn(weighIn);

        InOrder order = inOrder(userJpaRepository, weeklyWeighInRepository);
        order.verify(userJpaRepository).save(user);
        order.verify(weeklyWeighInRepository).save(weighIn);
    }

    @Test
    public void should_return_all_weighins_for_user() {
        Long userId = 1L;

        WeeklyWeighIn weighIn1 = new WeeklyWeighIn();
        weighIn1.setDate(LocalDate.of(2024, 1, 22));
        weighIn1.setWeight(80.0);

        WeeklyWeighIn weighIn2 = new WeeklyWeighIn();
        weighIn2.setDate(LocalDate.of(2024, 1, 15));
        weighIn2.setWeight(81.0);

        when(weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId))
                .thenReturn(List.of(weighIn1, weighIn2));

        List<WeeklyWeighIn> result = weeklyWeighInService.getAllByUser(userId);

        assertEquals(2, result.size());
        assertEquals(80.0, result.get(0).getWeight());
        assertEquals(81.0, result.get(1).getWeight());
    }

    @Test
    public void should_return_latest_weighin_for_user() {
        Long userId = 1L;

        WeeklyWeighIn latest = new WeeklyWeighIn();
        latest.setDate(LocalDate.of(2024, 1, 22));
        latest.setWeight(80.0);

        WeeklyWeighIn older = new WeeklyWeighIn();
        older.setDate(LocalDate.of(2024, 1, 15));
        older.setWeight(81.5);

        when(weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId))
                .thenReturn(List.of(latest, older));

        Optional<WeeklyWeighIn> result = weeklyWeighInService.getLatestByUser(userId);

        assertTrue(result.isPresent());
        assertEquals(80.0, result.get().getWeight());
        assertEquals(LocalDate.of(2024, 1, 22), result.get().getDate());
    }

    @Test
    public void should_return_empty_optional_when_no_weighin_exists() {
        Long userId = 99L;
        when(weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId))
                .thenReturn(List.of());

        Optional<WeeklyWeighIn> result = weeklyWeighInService.getLatestByUser(userId);

        assertFalse(result.isPresent());
    }
}
