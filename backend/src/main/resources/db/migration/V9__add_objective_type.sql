-- Allow dayOfWeek = -1 for "every day" objectives (STEPS type)
ALTER TABLE user_objectives DROP CONSTRAINT IF EXISTS user_objectives_day_of_week_check;
ALTER TABLE user_objectives ADD CONSTRAINT user_objectives_day_of_week_check
  CHECK (day_of_week BETWEEN -1 AND 6);

ALTER TABLE user_objectives ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM';
ALTER TABLE user_objectives ADD COLUMN target_value INT;
