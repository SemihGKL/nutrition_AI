-- Empêche les pesées en double le même jour et rend "latest" déterministe.

-- Dédup préventive : garder la pesée d'id le plus élevé par (user_id, date).
DELETE FROM weekly_weigh_in
WHERE id NOT IN (
    SELECT MAX(id) FROM weekly_weigh_in GROUP BY user_id, date
);

ALTER TABLE weekly_weigh_in
    ADD CONSTRAINT uq_weekly_weigh_in_user_date UNIQUE (user_id, date);
