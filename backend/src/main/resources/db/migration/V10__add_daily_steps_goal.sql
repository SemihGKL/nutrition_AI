ALTER TABLE users ADD COLUMN daily_steps_goal INT;

-- Migrate existing STEPS objectives to user profile
UPDATE users u
SET daily_steps_goal = (
    SELECT uo.target_value
    FROM user_objectives uo
    WHERE uo.user_id = u.id AND uo.type = 'STEPS'
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM user_objectives uo
    WHERE uo.user_id = u.id AND uo.type = 'STEPS'
);

-- Remove all STEPS objectives (completions deleted via CASCADE)
DELETE FROM user_objectives WHERE type = 'STEPS';
