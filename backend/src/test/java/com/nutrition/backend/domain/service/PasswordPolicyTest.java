package com.nutrition.backend.domain.service;

import com.nutrition.backend.domain.exception.WeakPasswordException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyTest {

    private PasswordPolicy passwordPolicy;

    @BeforeEach
    void setUp() {
        passwordPolicy = new PasswordPolicy();
    }

    @Test
    void should_accept_a_password_of_minimum_length() {
        assertThatCode(() -> passwordPolicy.validate("abcdefgh"))
                .doesNotThrowAnyException();
    }

    @Test
    void should_reject_a_password_shorter_than_8_characters() {
        assertThatThrownBy(() -> passwordPolicy.validate("short"))
                .isInstanceOf(WeakPasswordException.class);
    }

    @Test
    void should_reject_a_null_password() {
        assertThatThrownBy(() -> passwordPolicy.validate(null))
                .isInstanceOf(WeakPasswordException.class);
    }

    @Test
    void should_reject_a_blank_password_even_when_long_enough() {
        assertThatThrownBy(() -> passwordPolicy.validate("        "))
                .isInstanceOf(WeakPasswordException.class);
    }

    @Test
    void should_reject_a_password_longer_than_72_characters() {
        String tooLong = "a".repeat(73);
        assertThatThrownBy(() -> passwordPolicy.validate(tooLong))
                .isInstanceOf(WeakPasswordException.class);
    }
}
