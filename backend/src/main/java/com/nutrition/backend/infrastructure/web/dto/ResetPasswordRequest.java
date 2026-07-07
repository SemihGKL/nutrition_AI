package com.nutrition.backend.infrastructure.web.dto;

public record ResetPasswordRequest(String token, String newPassword) {}
