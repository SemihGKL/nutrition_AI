package com.nutrition.backend.web.dto;

public record AuthResponse(String token, UserDto user) {}
