-- Poids objectif décimal (ex. 72,5 kg) : l'entier tronquait la saisie.
ALTER TABLE users ALTER COLUMN weight_goal TYPE DOUBLE PRECISION;
