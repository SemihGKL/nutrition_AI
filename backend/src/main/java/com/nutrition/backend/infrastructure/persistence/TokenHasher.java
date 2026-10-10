package com.nutrition.backend.infrastructure.persistence;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Empreinte des jetons stockés (session, réinitialisation) : la base ne contient jamais
 * le jeton lui-même, une fuite ne donne donc pas de session valide.
 * ⚠️ SYNC : même formule que la migration V21 (encode(sha256(convert_to(token, 'UTF8')), 'hex')).
 */
final class TokenHasher {

    private TokenHasher() {}

    static String sha256Hex(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e); // garanti par la JVM
        }
    }
}
