CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    username         VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    gender           VARCHAR(10)  NOT NULL,
    age              INT          NOT NULL,
    height           FLOAT8       NOT NULL,
    activity_level   VARCHAR(25)  NOT NULL,
    daily_calorie_goal INT,
    weight_goal      INT,
    start_weight     FLOAT8,
    current_weight   FLOAT8,
    password         VARCHAR(255)
);

CREATE TABLE daily_calories (
    id                 BIGSERIAL PRIMARY KEY,
    date               DATE,
    calories_consumed  INT,
    is_confirmed       BOOLEAN,
    user_id            BIGINT REFERENCES users(id)
);
