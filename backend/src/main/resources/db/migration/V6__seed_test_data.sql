-- Utilisateur test : homme, 86 kg, 178 cm, 26 ans
-- MBR = 1847 kcal | TDEE (mod. actif x1.55) = 2864 kcal | Objectif = 2400 kcal (déficit ~464)
-- Données du 1 juin 2026 au 1 juillet 2026

WITH new_user AS (
    INSERT INTO users (username, email, gender, age, height, daily_calorie_goal, weight_goal, start_weight, current_weight, password, weigh_in_day)
    VALUES ('testuser', 'testuser@example.com', 'MALE', 26, 178.0, 2400, 80, 86.0, 84.7, NULL, 'MONDAY')
    RETURNING id
),

insert_daily AS (
    INSERT INTO daily_calories (date, calories_consumed, is_confirmed, steps, calories_burned, user_id)
    SELECT d.day::date, d.calories, true, d.steps, d.burned, u.id
    FROM (VALUES
        ('2026-06-01', 2180, 9500,  352),
        ('2026-06-02', 2250, 10200, 377),
        ('2026-06-03', 2320, 8800,  326),
        ('2026-06-04', 2150, 11500, 426),
        ('2026-06-05', 2400, 9100,  337),
        ('2026-06-06', 2680, 4800,  178),
        ('2026-06-07', 2720, 3900,  144),
        ('2026-06-08', 2100, 10800, 400),
        ('2026-06-09', 2280, 9200,  340),
        ('2026-06-10', 2350, 8500,  315),
        ('2026-06-11', 2190, 11200, 414),
        ('2026-06-12', 2420, 7800,  289),
        ('2026-06-13', 2600, 5500,  204),
        ('2026-06-14', 2750, 4200,  155),
        ('2026-06-15', 2160, 10500, 389),
        ('2026-06-16', 2240, 9800,  363),
        ('2026-06-17', 2310, 8100,  300),
        ('2026-06-18', 2200, 11800, 437),
        ('2026-06-19', 2380, 7500,  278),
        ('2026-06-20', 2620, 6200,  229),
        ('2026-06-21', 2700, 4100,  152),
        ('2026-06-22', 2130, 10600, 392),
        ('2026-06-23', 2260, 9400,  348),
        ('2026-06-24', 2340, 8700,  322),
        ('2026-06-25', 2170, 12000, 444),
        ('2026-06-26', 2450, 8300,  307),
        ('2026-06-27', 2580, 5800,  215),
        ('2026-06-28', 2720, 4600,  170),
        ('2026-06-29', 2150, 10100, 374),
        ('2026-06-30', 2270, 9300,  344),
        ('2026-07-01', 2200, 8400,  311)
    ) AS d(day, calories, steps, burned), new_user u
    RETURNING user_id
),

insert_weighins AS (
    INSERT INTO weekly_weigh_in (date, weight, note, user_id)
    SELECT w.day::date, w.weight::float8, w.note, u.id
    FROM (VALUES
        ('2026-06-01', 86.0, 'Pesée initiale'),
        ('2026-06-08', 85.7, NULL),
        ('2026-06-15', 85.3, NULL),
        ('2026-06-22', 85.0, NULL),
        ('2026-06-29', 84.7, NULL)
    ) AS w(day, weight, note), new_user u
    RETURNING user_id
)

SELECT 'Seed data inserted for testuser' AS result;
