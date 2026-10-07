-- Saisie par repas : calories_consumed reste le total (somme des repas),
-- les entrées antérieures gardent leur total avec des repas à 0.
ALTER TABLE daily_calories
    ADD COLUMN breakfast_kcal INT NOT NULL DEFAULT 0 CHECK (breakfast_kcal >= 0),
    ADD COLUMN lunch_kcal     INT NOT NULL DEFAULT 0 CHECK (lunch_kcal >= 0),
    ADD COLUMN snack_kcal     INT NOT NULL DEFAULT 0 CHECK (snack_kcal >= 0),
    ADD COLUMN dinner_kcal    INT NOT NULL DEFAULT 0 CHECK (dinner_kcal >= 0);
