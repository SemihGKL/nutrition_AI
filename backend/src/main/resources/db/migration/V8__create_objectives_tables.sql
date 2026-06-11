CREATE TABLE user_objectives (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    label VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0
);

CREATE TABLE objective_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    objective_id BIGINT NOT NULL REFERENCES user_objectives(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    CONSTRAINT uq_objective_completion UNIQUE (objective_id, date)
);
