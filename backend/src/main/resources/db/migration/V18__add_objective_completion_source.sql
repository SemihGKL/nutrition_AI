-- Origine d'une coche d'objectif : MANUAL (utilisateur) ou AUTO (séance de sport saisie).
-- Seules les coches AUTO sont retirées quand la séance repasse à 0. Les coches existantes,
-- d'origine inconnue, sont considérées manuelles pour ne jamais être retirées à tort.
ALTER TABLE objective_completions
    ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'MANUAL'
        CHECK (source IN ('MANUAL', 'AUTO'));
