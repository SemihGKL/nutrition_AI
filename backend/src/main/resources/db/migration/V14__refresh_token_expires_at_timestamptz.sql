-- RefreshTokenJpaEntity mappe expiresAt (Instant) en TIMESTAMP WITH TIME ZONE,
-- mais V11 avait créé la colonne en TIMESTAMP (sans fuseau). Sur une base fraîche,
-- hibernate ddl-auto=validate échoue au démarrage (timestamp vs timestamptz).
-- On aligne la colonne sur l'entité.
ALTER TABLE refresh_tokens ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE;
