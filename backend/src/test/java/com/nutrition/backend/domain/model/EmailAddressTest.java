package com.nutrition.backend.domain.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailAddressTest {

    @Test
    void should_lowercase_and_trim_email_when_normalizing() {
        assertThat(EmailAddress.normalize("  Alice.Martin@Example.COM ")).isEqualTo("alice.martin@example.com");
    }

    @Test
    void should_keep_an_already_normalized_email_unchanged() {
        assertThat(EmailAddress.normalize("bob@example.com")).isEqualTo("bob@example.com");
    }
}
