-- Un email = un compte, sans tenir compte de la casse : « Alice@x.fr » et « alice@x.fr » ne
-- peuvent plus coexister (l'inscription normalise déjà en minuscules depuis la v0.4.0 ; seuls
-- d'anciens comptes pouvaient encore différer par la casse).
-- ⚠️ Échoue si de tels doublons existent déjà (message : Key (lower(email))=(…) is duplicated) :
-- les fusionner à la main avant de déployer. Postgres annule alors la migration et le
-- déploiement revient automatiquement à la version précédente.
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
