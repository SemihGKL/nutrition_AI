-- Verrouillage optimiste sur users : évite les lost updates (ex. pesée qui écrase
-- une édition de profil concurrente, ou l'inverse).
ALTER TABLE users ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
