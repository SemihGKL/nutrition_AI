-- Date du dernier envoi de chaque rappel repas : permet de rattraper un rappel manqué
-- pendant un redémarrage du serveur sans jamais l'envoyer deux fois le même jour.
ALTER TABLE meal_reminders ADD COLUMN last_sent_on DATE;
