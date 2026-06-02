package com.nutrition.backend.Service;

import com.nutrition.backend.Class.User;
import com.nutrition.backend.Class.WeeklyWeighIn;
import com.nutrition.backend.Repository.WeeklyWeighInRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WeeklyWeighInServiceTest {

    @Mock
    private WeeklyWeighInRepository weeklyWeighInRepository;

    @InjectMocks
    private WeeklyWeighInService weeklyWeighInService;

    @Test
    public void should_save_weighin_when_valid_data() {
        // Given
        User user = new User();
        user.setUsername("john");

        WeeklyWeighIn weighIn = new WeeklyWeighIn();
        weighIn.setDate(LocalDate.of(2024, 1, 15));
        weighIn.setWeight(80.5);
        weighIn.setUser(user);

        WeeklyWeighIn savedWeighIn = new WeeklyWeighIn();
        savedWeighIn.setDate(LocalDate.of(2024, 1, 15));
        savedWeighIn.setWeight(80.5);
        savedWeighIn.setUser(user);

        when(weeklyWeighInRepository.save(any(WeeklyWeighIn.class))).thenReturn(savedWeighIn);

        // When
        WeeklyWeighIn result = weeklyWeighInService.saveWeighIn(weighIn);

        // Then
        assertEquals(80.5, result.getWeight());
        assertEquals(LocalDate.of(2024, 1, 15), result.getDate());
    }

    @Test
    public void should_return_all_weighins_for_user() {
        // Given
        Long userId = 1L;

        WeeklyWeighIn weighIn1 = new WeeklyWeighIn();
        weighIn1.setDate(LocalDate.of(2024, 1, 22));
        weighIn1.setWeight(80.0);

        WeeklyWeighIn weighIn2 = new WeeklyWeighIn();
        weighIn2.setDate(LocalDate.of(2024, 1, 15));
        weighIn2.setWeight(81.0);

        when(weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId))
                .thenReturn(List.of(weighIn1, weighIn2));

        // When
        List<WeeklyWeighIn> result = weeklyWeighInService.getAllByUser(userId);

        // Then
        assertEquals(2, result.size());
        assertEquals(80.0, result.get(0).getWeight());
        assertEquals(81.0, result.get(1).getWeight());
    }

    @Test
    public void should_return_latest_weighin_for_user() {
        // Given
        Long userId = 1L;

        WeeklyWeighIn latest = new WeeklyWeighIn();
        latest.setDate(LocalDate.of(2024, 1, 22));
        latest.setWeight(80.0);

        WeeklyWeighIn older = new WeeklyWeighIn();
        older.setDate(LocalDate.of(2024, 1, 15));
        older.setWeight(81.5);

        when(weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId))
                .thenReturn(List.of(latest, older));

        // When
        Optional<WeeklyWeighIn> result = weeklyWeighInService.getLatestByUser(userId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(80.0, result.get().getWeight());
        assertEquals(LocalDate.of(2024, 1, 22), result.get().getDate());
    }

    @Test
    public void should_return_empty_optional_when_no_weighin_exists() {
        // Given
        Long userId = 99L;
        when(weeklyWeighInRepository.findByUserIdOrderByDateDesc(userId))
                .thenReturn(List.of());

        // When
        Optional<WeeklyWeighIn> result = weeklyWeighInService.getLatestByUser(userId);

        // Then
        assertFalse(result.isPresent());
    }
}
