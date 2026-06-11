ALTER TABLE users
    ADD CONSTRAINT uq_users_email UNIQUE (email);

ALTER TABLE daily_calories
    ADD CONSTRAINT uq_daily_calories_user_date UNIQUE (user_id, date);
