package com.nutrition.backend.Service;

import com.nutrition.backend.application.usecase.GetDailyRecapUseCase;
import com.nutrition.backend.web.dto.DailyRecapResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DailyRecapService {

    private final GetDailyRecapUseCase getDailyRecapUseCase;

    public DailyRecapService(GetDailyRecapUseCase getDailyRecapUseCase) {
        this.getDailyRecapUseCase = getDailyRecapUseCase;
    }

    public DailyRecapResponse getRecap(Long userId, LocalDate date) {
        return getDailyRecapUseCase.execute(userId, date);
    }
}
