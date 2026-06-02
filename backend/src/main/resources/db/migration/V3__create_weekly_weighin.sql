CREATE TABLE weekly_weigh_in (
    id       BIGSERIAL PRIMARY KEY,
    date     DATE         NOT NULL,
    weight   FLOAT8       NOT NULL,
    note     VARCHAR(255),
    user_id  BIGINT       NOT NULL REFERENCES users(id)
);
