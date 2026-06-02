# NutritionIA — Descriptif des vues frontend

> Document à destination du développeur frontend.
> Ce document décrit les vues principales de l'application, leur contenu et leur comportement attendu.
> Il ne prescrit pas de technologie particulière — React + Vite est la stack prévue.

---

## Vues de l'application

1. [Login / Register](#1-login--register)
2. [Onboarding](#2-onboarding)
3. [Dashboard quotidien](#3-dashboard-quotidien)
4. [Vue hebdomadaire](#4-vue-hebdomadaire)
5. [Récapitulatif de semaine](#5-récapitulatif-de-semaine)
6. [Profil utilisateur](#6-profil-utilisateur)

---

## 1. Login / Register

**Objectif** : authentifier l'utilisateur ou créer un nouveau compte.

### Login
- Formulaire : email + mot de passe
- Bouton "Se connecter"
- Lien vers la page d'inscription
- En cas d'erreur : message inline sous le champ concerné

### Register
- Formulaire : username, email, mot de passe
- Bouton "Créer mon compte"
- Lien retour vers le login
- Après inscription réussie → redirection vers l'Onboarding

---

## 2. Onboarding

**Objectif** : collecter les informations de profil pour calculer le MBR, le TDEE et l'objectif calorique.

**Déclenché uniquement à la première connexion.**

### Étapes (formulaire multi-étapes recommandé)

**Étape 1 — Informations physiques**
- Âge (nombre entier, années)
- Taille (cm)
- Poids de départ (kg, une décimale)
- Genre (Homme / Femme)

**Étape 2 — Niveau d'activité**
- Choix unique parmi :
  - Sédentaire (peu ou pas de sport)
  - Légèrement actif (1–3 jours/semaine)
  - Modérément actif (3–5 jours/semaine)
  - Très actif (6–7 jours/semaine)
  - Extrêmement actif (sportif professionnel)

**Étape 3 — Résultat et confirmation**
- Affichage calculé (lecture seule) :
  - MBR : `X kcal/jour`
  - TDEE : `X kcal/jour`
  - Objectif calorique suggéré (TDEE − déficit recommandé) : `X kcal/jour`
  - Pourcentage de déficit par rapport au MBR : `−X %`
- L'utilisateur peut ajuster manuellement l'objectif calorique proposé
- Bouton "Commencer" → enregistre le profil et redirige vers le Dashboard

---

## 3. Dashboard quotidien

**Objectif** : vue principale de l'application. L'utilisateur saisit ses calories du jour et visualise son bilan.

### Composant central — Anneau de progression

- Anneau circulaire (ring chart) affichant : `kcal consommées / objectif calorique`
- Valeur numérique affichée au centre : `1 650 / 1 800 kcal`
- Couleur dynamique selon l'écart :
  - Vert : dans l'objectif (≤ 100% de l'objectif)
  - Orange : léger dépassement (entre 100% et 115%)
  - Rouge : dépassement significatif (> 115%)
- Sous l'anneau : message contextuel
  - Si sous l'objectif : "Il te reste **X kcal** aujourd'hui"
  - Si dépassement : "Dépassement de **X kcal** aujourd'hui"

### Saisie du jour

Formulaire simple avec les champs suivants :
- **Calories consommées** (obligatoire, nombre entier)
- **Nombre de pas** (optionnel, nombre entier)
- **Calories brûlées** (optionnel, nombre entier — sport ou activité)

Bouton "Enregistrer" → met à jour l'affichage en temps réel.

### Bilan net

Affiché uniquement si les calories brûlées sont renseignées :

```
Consommé  :  1 800 kcal
Brûlé     :    300 kcal
───────────────────────
Net       :  1 500 kcal  →  Déficit de 300 kcal ✅
```

### Indicateur de déficit MBR

Affiché en permanence sous le bilan :
- Libellé : "Déficit actuel par rapport au MBR"
- Valeur : `−X %`
- Exemple : si MBR = 1 900 kcal et objectif = 1 500 kcal → `−21 %`
- Indicateur visuel (badge coloré) :
  - Vert : déficit entre 10% et 25% (zone recommandée)
  - Orange : déficit entre 25% et 35% (attention)
  - Rouge : déficit > 35% (trop agressif)
  - Gris : pas de déficit (objectif ≥ MBR)

### Confirmation de journée

- Bouton "Confirmer ma journée" visible en bas de la vue
- Après confirmation : les champs passent en lecture seule, le bouton disparaît
- Indicateur visuel que la journée est confirmée (ex. coche verte sur la date)

### Navigation date

- Flèches gauche / droite pour naviguer entre les jours
- Affichage de la date courante : `Vendredi 2 mai`
- On ne peut pas saisir dans le futur
- Les journées confirmées sont accessibles en lecture seule

---

## 4. Vue hebdomadaire

**Objectif** : visualiser l'évolution des calories sur les 7 derniers jours.

### Graphe en barres

- 7 barres verticales (une par jour de la semaine, lundi → dimanche)
- Hauteur de chaque barre = kcal consommées nettes du jour
- Une ligne horizontale fixe = objectif calorique de l'utilisateur
- Couleur des barres :
  - Vert : kcal nettes ≤ objectif
  - Rouge : kcal nettes > objectif
- Jours non encore saisis : barre vide ou grisée
- Au tap / survol d'une barre : tooltip avec les valeurs exactes du jour

### Résumé sous le graphe

- Moyenne kcal sur la semaine : `Moy. 1 750 kcal/jour`
- Objectif calorique rappelé : `Objectif : 1 800 kcal/jour`
- Déficit ou surplus moyen de la semaine

---

## 5. Récapitulatif de semaine

**Objectif** : bilan chiffré complet d'une semaine écoulée. Accessible depuis la vue hebdomadaire ou via navigation.

### Bloc 1 — Détail jour par jour

Tableau ou liste :

| Jour | kcal consommées | Bilan |
|------|----------------|-------|
| Lun  | 1 650 kcal     | ✅ −150 |
| Mar  | 2 100 kcal     | 🔴 +300 |
| Mer  | 1 720 kcal     | ✅ −80  |
| ...  | ...            | ...   |

### Bloc 2 — Bilan déficit de la semaine

```
Déficit théorique   : −1 400 kcal
Déficit réel        :   −980 kcal
Écart               :   +420 kcal  ⚠️
```

- Déficit théorique = (objectif calorique − TDEE) × 7
- Déficit réel = somme des bilans journaliers
- Si l'écart est positif : l'utilisateur a consommé plus que prévu

### Bloc 3 — Évolution du poids

```
Pesée précédente : 82.4 kg
Pesée actuelle   : 82.0 kg
Différence       : −0.4 kg
```

- Si aucune pesée cette semaine : invitation à enregistrer son poids

### Bloc 4 — Lecture de cohérence

Ligne de synthèse automatique (calcul, pas d'IA) :

> "Déficit de 980 kcal cette semaine → perte théorique attendue : ~0.28 kg. Perte réelle : 0.4 kg."

Calcul : 1 kg de graisse ≈ 7 700 kcal. Perte théorique = déficit réel / 7 700.

---

## 6. Profil utilisateur

**Objectif** : consulter et mettre à jour les informations personnelles. Recalculer le MBR si nécessaire.

### Informations affichées (lecture seule par défaut)

- Username, email
- Âge, taille, poids de départ, poids actuel
- Niveau d'activité
- MBR calculé, TDEE calculé, objectif calorique actuel
- **Pourcentage de déficit par rapport au MBR** : `−X %`

### Actions disponibles

- Bouton "Modifier mon profil" → édition des champs (âge, activité, poids actuel)
- Bouton "Recalculer mon MBR" → recalcul automatique à partir des nouvelles valeurs, proposition du nouvel objectif calorique avec possibilité d'ajuster

---

## Notes générales

- L'application est une **PWA** : elle doit être installable sur mobile et fonctionner correctement sur écran de smartphone (320px minimum).
- Le design doit être **minimaliste** : une action principale par écran, pas d'encombrement visuel.
- Toutes les données sont persistées côté backend via API REST — pas de localStorage pour les données métier.
- Les appels API utilisent un JWT en header Authorization (`Bearer <token>`).