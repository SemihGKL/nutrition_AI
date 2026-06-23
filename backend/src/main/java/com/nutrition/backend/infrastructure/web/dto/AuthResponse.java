package com.nutrition.backend.infrastructure.web.dto;

public record AuthResponse(String token, UserDto user) {}
