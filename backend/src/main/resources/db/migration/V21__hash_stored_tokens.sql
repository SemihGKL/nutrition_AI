-- Les jetons de session et de réinitialisation ne sont plus stockés en clair : seule leur
-- empreinte SHA-256 (hex) est conservée. Conversion des jetons existants, pour que les
-- sessions ouvertes et les liens en cours restent valides.
-- ⚠️ SYNC : même formule que TokenHasher.sha256Hex (UTF-8, hexadécimal minuscule).
UPDATE refresh_tokens        SET token = encode(sha256(convert_to(token, 'UTF8')), 'hex');
UPDATE password_reset_tokens SET token = encode(sha256(convert_to(token, 'UTF8')), 'hex');
