-- Deduplicate users: keep lowest id per email, cascade-delete dependents first
DELETE FROM weekly_weigh_in
WHERE user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY email)
);

DELETE FROM daily_calories
WHERE user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY email)
);

DELETE FROM users
WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY email);

-- Deduplicate daily_calories: keep highest id per (user_id, date)
DELETE FROM daily_calories
WHERE id NOT IN (
    SELECT MAX(id) FROM daily_calories GROUP BY user_id, date
);

ALTER TABLE users
    ADD CONSTRAINT uq_users_email UNIQUE (email);

ALTER TABLE daily_calories
    ADD CONSTRAINT uq_daily_calories_user_date UNIQUE (user_id, date);
