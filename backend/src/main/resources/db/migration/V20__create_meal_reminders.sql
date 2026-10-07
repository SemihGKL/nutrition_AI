-- Rappels push pour renseigner les repas, à l'heure réglée par l'utilisateur.
CREATE TABLE meal_reminders (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal          VARCHAR(10) NOT NULL CHECK (meal IN ('BREAKFAST', 'LUNCH', 'SNACK', 'DINNER')),
    reminder_time TIME        NOT NULL,
    enabled       BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_meal_reminder UNIQUE (user_id, meal)
);

CREATE INDEX idx_meal_reminders_enabled_time ON meal_reminders (reminder_time) WHERE enabled;
