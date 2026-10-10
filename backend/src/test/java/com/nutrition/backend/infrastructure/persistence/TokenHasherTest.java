package com.nutrition.backend.infrastructure.persistence;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenHasherTest {

    @Test
    void should_return_the_sha256_hex_digest_of_the_token() {
        // Valeur de référence SHA-256("abc") (FIPS 180-2)
        assertThat(TokenHasher.sha256Hex("abc"))
                .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    @Test
    void should_produce_a_fixed_length_digest_that_fits_the_token_column() {
        assertThat(TokenHasher.sha256Hex("9f1c2e4a-5b6d-4e7f-8a9b-0c1d2e3f4a5b")).hasSize(64);
    }
}
