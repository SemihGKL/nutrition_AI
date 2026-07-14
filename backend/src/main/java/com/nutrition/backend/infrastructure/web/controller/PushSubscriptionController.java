package com.nutrition.backend.infrastructure.web.controller;

import com.nutrition.backend.application.usecase.DeletePushSubscriptionUseCase;
import com.nutrition.backend.application.usecase.GetUserProfileUseCase;
import com.nutrition.backend.application.usecase.SavePushSubscriptionUseCase;
import com.nutrition.backend.domain.entity.User;
import com.nutrition.backend.infrastructure.web.dto.PushSubscribeRequest;
import com.nutrition.backend.infrastructure.web.dto.PushUnsubscribeRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushSubscriptionController {

    private final SavePushSubscriptionUseCase savePushSubscriptionUseCase;
    private final DeletePushSubscriptionUseCase deletePushSubscriptionUseCase;
    private final GetUserProfileUseCase getUserProfileUseCase;
    private final String vapidPublicKey;

    public PushSubscriptionController(SavePushSubscriptionUseCase savePushSubscriptionUseCase,
                                      DeletePushSubscriptionUseCase deletePushSubscriptionUseCase,
                                      GetUserProfileUseCase getUserProfileUseCase,
                                      @Value("${app.vapid.public-key}") String vapidPublicKey) {
        this.savePushSubscriptionUseCase = savePushSubscriptionUseCase;
        this.deletePushSubscriptionUseCase = deletePushSubscriptionUseCase;
        this.getUserProfileUseCase = getUserProfileUseCase;
        this.vapidPublicKey = vapidPublicKey;
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", vapidPublicKey));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@Valid @RequestBody PushSubscribeRequest request,
                                          Authentication auth) {
        User user = getUserProfileUseCase.byEmail(auth.getName());
        savePushSubscriptionUseCase.execute(user.getId(), request.endpoint(), request.p256dh(), request.auth());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@Valid @RequestBody PushUnsubscribeRequest request) {
        deletePushSubscriptionUseCase.execute(request.endpoint());
        return ResponseEntity.noContent().build();
    }
}
