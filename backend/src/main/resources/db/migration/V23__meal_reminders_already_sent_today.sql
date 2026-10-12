-- Passage à l'envoi avec rattrapage (V22) : last_sent_on est vide partout. Sans cette
-- mise à jour, au premier démarrage, les rappels déjà envoyés aujourd'hui par l'ancienne
-- version dans les 10 dernières minutes repartiraient une seconde fois.
UPDATE meal_reminders
SET last_sent_on = (now() AT TIME ZONE 'Europe/Paris')::date
WHERE reminder_time <= (now() AT TIME ZONE 'Europe/Paris')::time
  AND last_sent_on IS NULL;
