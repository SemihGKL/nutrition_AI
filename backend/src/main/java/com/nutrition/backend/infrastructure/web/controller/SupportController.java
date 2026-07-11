package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.SendSupportMessageUseCase;
import com.nutrition.backend.domain.model.SupportCategory;
import com.nutrition.backend.infrastructure.web.dto.SupportRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SendSupportMessageUseCase sendSupportMessageUseCase;

    public SupportController(SendSupportMessageUseCase sendSupportMessageUseCase) {
        this.sendSupportMessageUseCase = sendSupportMessageUseCase;
    }

    @PostMapping
    public ResponseEntity<Void> sendSupportMessage(@Valid @RequestBody SupportRequest request, Authentication auth) {
        try {
            SupportCategory category = SupportCategory.valueOf(String.valueOf(request.category()).toUpperCase());
            sendSupportMessageUseCase.execute(auth.getName(), category, request.message());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            // Catégorie inconnue ou message vide → requête invalide.
            return ResponseEntity.badRequest().build();
        }
    }
}
