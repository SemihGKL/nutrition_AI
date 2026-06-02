# Handoff — kaloriim · frontend hi-fi

## Overview

**kaloriim** est une PWA mobile-first de comptage calorique minimaliste. Pas de scan de code-barres, pas de macros, pas de base d'aliments. L'utilisateur saisit **un total kcal par jour**, ses pas, ses calories brûlées. L'app calcule son MBR/TDEE à l'inscription, lui donne un objectif quotidien, et tient une **série** (streak) façon Duolingo pour ancrer l'habitude.

Cible : francophones, tutoiement, langage factuel et chaleureux.

## À propos des fichiers de design

Les fichiers de ce bundle sont des **références design créées en HTML/JSX** — des prototypes qui montrent l'apparence et le comportement souhaités. **Ce ne sont pas du code de production à copier tel quel.**

L'objectif est de **recréer ces designs dans l'environnement cible** (Next.js + Tailwind, Remix, SvelteKit, React Native, etc. — au choix selon le projet) en utilisant les patterns et la stack du codebase existant. Si aucun environnement n'existe encore, **Next.js 14 (App Router) + TypeScript + Tailwind CSS + CSS variables** est une excellente base pour cette app PWA.

Tous les composants JSX du bundle utilisent React 18 via Babel-in-the-browser (CDN). En production, ils doivent être convertis en composants React/Vue/Svelte propres avec leur typage et leur découpage logique.

## Fidélité

**Hi-fi** — pixel-perfect. Couleurs, typo, espacements, rayons, ombres, et copy sont définitifs. Le développeur doit reproduire fidèlement, en utilisant les variables et tokens fournis dans `tokens.css`.

Le système a été calibré sur l'écran Dashboard mobile et validé avant d'être déroulé sur les autres écrans — donc la cohérence visuelle est garantie.

---

## Stack recommandée

- **Next.js 14** (App Router) ou **Vite + React** pour SPA
- **TypeScript** strict
- **Tailwind CSS** + tokens CSS personnalisés (utiliser `tokens.css` comme base, le porter en `@theme` ou variables CSS)
- **Inter** + **Fraunces** + **Instrument Serif** via `next/font` ou `@fontsource`
- Stockage local : **IndexedDB** (via `idb` ou `Dexie.js`) pour les saisies quotidiennes — l'app est offline-first
- Auth : **Supabase Auth** ou **Clerk** (adapter la maquette Login)
- Charts custom (les barres et le ring sont en SVG pur dans les mocks — réutilisables tels quels)
- PWA : `next-pwa` ou Vite PWA plugin pour le mode hors-ligne

---

## Écrans (10 vues)

### 1. Login
**But :** se connecter / s'inscrire.

**Mobile (`LoginMobile` — `login.jsx`)** — 3 modes :
- `fresh` : pas de hook
- `returning` : pill orange « ta série **42** t'attend » au-dessus du formulaire (rétention)
- `error` : message rouge sous le champ mot de passe

Layout : wordmark Fraunces italique 44px centré, baseline « compte les bonnes choses. » en Instrument Serif 17px, formulaire 2 champs (email + password), CTA pleine largeur orange, lien « pas de compte ? créer ».

**Desktop (`LoginDesktop`)** — split 50/50 :
- Gauche : hero crème, wordmark 64px en haut, titre 56px « compte les calories, garde la série. » (le 2e morceau en italique Instrument Serif orange), texte explicatif, streak chip large
- Droite : formulaire centré, max-width 380px

### 2. Onboarding
**But :** collecter les infos pour calculer MBR/TDEE et proposer un objectif.

**3 étapes** (`OnboardingMobile`, `OnboardingDesktop`) :
1. **Physique** : âge, taille, poids départ, genre (segmented toggle Homme/Femme)
2. **Activité** : 5 cartes radio (Sédentaire / Légèrement / Modérément / Très / Extrême) avec hint « 1–3 j/sem » etc.
3. **Résultat** : 2 stats (MBR + TDEE) en grid, gros card orange-tint avec objectif suggéré (kcal/jour, déficit % vs MBR), slider d'ajustement (range 1500–2200)

Mobile : `<StepBar>` 3 segments en haut, contenu central, footer fixe avec retour + CTA « continuer » / « c'est parti ».
Desktop : sidebar gauche 260px avec stepper vertical (numéros, états done/active/upcoming), contenu à droite max-width 540px.

### 3. Dashboard quotidien
**But :** écran principal de saisie, vu plusieurs fois par jour.

**Mobile (`DashboardMobile`)** — 4 états :
- `empty` : début de journée, ring vide à 0
- `progress` : 1 650 / 1 800, ring vert, message « il te reste 150 kcal aujourd'hui »
- `over` : 2 050 / 1 800, ring rouge avec arc de dépassement, « dépassement de 250 kcal — pas grave »
- `confirmed` (`DashboardMobileConfirmed`) : célébration card orange avec série 43, confetti statiques, bilan du jour, prochain palier

Composition (état progress) :
- Status bar iOS-style
- Top : date « vendredi · 2 mai » + nav précédent/suivant + StreakChip
- Hero : `<ProgressRing size=232 stroke=14>` au centre
- Message contextuel sous le ring
- Card « déficit vs MBR » avec `<MBRGauge>` 4 zones
- Section « saisie du jour » : Stepper Calories pleine largeur + grid 2 colonnes (Pas + Brûlées)
- Card « bilan net » récap kcal − brûlées
- CTA « Confirmer ma journée » orange pleine largeur
- Bottom nav 4 tabs

**Desktop (`DashboardDesktop`)** — sidebar gauche 220px (wordmark + 4 tabs + carte série en bas) + contenu : top bar avec date et CTA confirmer, grid 2-col (ring card + saisie card), pip strip 14j en pleine largeur en bas.

### 4. Semaine
**But :** vue hebdomadaire avec progression.

**Mobile (`WeeklyMobile`)** :
- Header : « semaine 18 · 28 avr → 4 mai » + StreakChip
- Card barres verticales L→D (kcal nettes/jour), ligne pointillée orange = objectif, couleurs : vert (tenu) / rouge (dépassé) / gris pointillé (futur), barre partielle en cours pour samedi
- Grid 3 stats : moyenne, déficit/jour, objectif
- Card « 14 derniers jours » avec PipStrip 1-rangée + bloc « prochain palier 50j » avec progress bar

**Desktop (`WeeklyDesktop`)** : grid 2:1 (barres grandes 260px de haut + 3 stats empilées), card pip strip pleine largeur.

### 5. Bilan / Récap
**But :** récap de fin de semaine, généré automatiquement.

**Mobile (`BilanMobile`)** :
- Card verte headline : `−0,4 kg` en gros (Fraunces 48px), « 82,4 → 82,0 kg · sur 7 jours »
- Card « jour par jour » : table 7 lignes (jour · kcal nettes · delta vs objectif · pastille ✓/×)
- Card orange « lecture de cohérence » : déficit cumulé, perte attendue, perte réelle, mini-explication « écart probablement lié à l'eau et au glycogène — c'est normal. »
- Card « théorique vs réel » : 2 barres horizontales comparatives
- Bouton « partager mon récap » outline

### 6. Profil
**But :** consulter ses infos, modifier, recalculer son MBR.

**Mobile (`ProfilMobile`)** :
- Header avatar (initiales JM dans cercle orange-tint) + nom + email + StreakChip + record perso
- Liste « tes infos » (Âge, Taille, Poids départ/actuel avec delta, Activité)
- Liste « tes calculs » (MBR, TDEE, Objectif, Déficit MBR avec pill verte −4%)
- 2 actions : « Modifier mon profil » + « Recalculer mon MBR »

**Desktop (`ProfilDesktop`)** : grid 2-col, header avec avatar 80px + boutons « éditer » outline + « recalculer MBR » primary.

---

## Composants partagés (`kaloriim-ui.jsx`)

| Composant | Props clés | Usage |
|---|---|---|
| `KWordmark` | `size`, `color` | Logotype Fraunces italique |
| `Flame` | `size`, `color`, `filled` | Icône flamme SVG monoline (pas d'emoji) |
| `Check`, `Chevron`, `Plus`, `Minus` | `size`, `color`, `sw` | Iconographie de base |
| `StreakChip` | `count`, `size` (sm/md/lg), `tone` (soft/outline) | Pill orange flame + nombre |
| `PipStrip` | `days[]`, `size`, `gap`, `twoRow` | 14 pastilles (`hit`/`miss`/`today`/`future`) |
| `ProgressRing` | `value`, `target`, `size`, `stroke`, `status` | Ring SVG animé, dépassement = arc rouge superposé |
| `MBRGauge` | `pct` (signé), `min`, `max` | Jauge horizontale 4 zones avec marker |
| `Stepper` | `label`, `value`, `onChange`, `suffix`, `step` | Input ±/− pour saisie |
| `Card` | `padding`, `tone` (paper/orange/green) | Conteneur générique |
| `BottomNav` | `active`, `onChange` | 4 onglets mobile (Jour/Semaine/Bilan/Profil) |
| `SidebarNav` | `active` | Sidebar desktop 220px |
| `DateHeader` | `weekday`, `date`, `canForward`, etc. | En-tête date avec navigation |
| `PrimaryCTA` | `tone` (orange/green/ink), `icon`, `disabled` | Bouton principal h=56 |
| `Field` | `label`, `value`, `onChange`, `type`, `error`, `hint` | Input avec focus ring orange et erreur inline |
| `SegmentedToggle` | `options[]`, `value`, `onChange` | Toggle 2-3 segments |
| `ActivityCard` | `value`, `label`, `hint`, `selected` | Radio card pour onboarding |

---

## Design tokens (`tokens.css`)

### Palette light

| Token | Valeur oklch | Usage |
|---|---|---|
| `--paper` | `oklch(0.985 0.012 75)` | Fond principal cream |
| `--paper-2` | `oklch(0.965 0.018 70)` | Fond carte / recess |
| `--paper-3` | `oklch(0.945 0.022 68)` | Fond plus profond |
| `--ink` | `oklch(0.22 0.020 60)` | Texte principal warm-black |
| `--ink-2` | `oklch(0.42 0.018 60)` | Texte secondaire |
| `--ink-3` | `oklch(0.62 0.015 65)` | Texte tertiaire / labels |
| `--ink-4` | `oklch(0.82 0.010 70)` | Hairline / placeholder |
| `--orange` | `oklch(0.66 0.175 42)` | Accent principal (streak, CTA) |
| `--orange-soft` | `oklch(0.92 0.055 50)` | Fond pill streak |
| `--orange-tint` | `oklch(0.96 0.030 55)` | Fond card célébration |
| `--green` | `oklch(0.62 0.115 145)` | Succès / objectif tenu |
| `--green-soft` | `oklch(0.92 0.045 145)` | Fond pill succès |
| `--green-tint` | `oklch(0.965 0.025 145)` | Fond card kg perdu |
| `--red` | `oklch(0.60 0.165 25)` | Erreur / dépassement |
| `--red-soft` | `oklch(0.93 0.055 25)` | Fond pill erreur |
| `--amber` | `oklch(0.76 0.130 78)` | Warning intermédiaire |
| `--amber-soft` | `oklch(0.94 0.060 80)` | Fond zone warning |
| `--hairline` | `oklch(0.88 0.012 70)` | Bordure standard |
| `--hairline-2` | `oklch(0.93 0.012 70)` | Bordure légère |

### Palette dark
Voir `tokens.css` — bascule via `[data-theme="dark"]` sur n'importe quel ancêtre. Tous les composants consomment uniquement les variables CSS, donc dark mode = changement d'attribut.

### Ombres
- `--shadow-sm` : `0 1px 2px rgba(60,40,20,.04), 0 4px 12px rgba(60,40,20,.04)`
- `--shadow-md` : `0 1px 2px rgba(60,40,20,.05), 0 8px 24px rgba(60,40,20,.06)`
- `--shadow-lg` : `0 1px 3px rgba(60,40,20,.06), 0 18px 40px rgba(60,40,20,.08)`

### Rayons
- `--radius-sm: 8px` (inputs, segmented)
- `--radius: 12px` (boutons secondaires, mini cards)
- `--radius-md: 16px` (cards principales)
- `--radius-lg: 20px`, `--radius-xl: 28px`

### Typographie

- **`--font-display: Fraunces`** — display, poids 500, letter-spacing -0.02em (titres, gros chiffres ring)
- **`--font-body: Inter`** — corps, poids 400/500/600 (UI, labels, formulaires)
- **`--font-script: Instrument Serif italic`** — wordmark `kaloriim` et baselines poétiques

**Tabular nums obligatoire** sur tous les chiffres : `font-variant-numeric: tabular-nums; font-feature-settings: "tnum"`. Classe utilitaire `.tabular`.

### Échelle d'espacement (Tailwind-compatible)
Multiples de 4 : 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64.

---

## Interactions et comportement

### Saisie quotidienne
- Stepper : tap +/− incrémente de 50 kcal (calories), 500 (pas), 50 (brûlées). Long-press = increment continu.
- Auto-save à chaque changement (badge « auto-enregistré » top-right de la section).
- Bouton « Confirmer ma journée » désactivé tant que `calories === 0`.

### Confirmation de journée
1. Tap CTA → ring se fige, anim ✓ apparaît au centre (300ms ease-out)
2. Container fait un léger « breathe » (scale 1 → 1.02 → 1, 600ms)
3. Transition vers vue confirmed : célébration card monte de 20px en s'opacifiant (400ms cubic-bezier(.2,.7,.2,1))
4. Si journée tenue (déficit ≤ 0%) : streak count incrémente avec micro-pulse de la flame
5. Si journée dépassée : pas de célébration, message neutre « journée enregistrée »

### Atteinte d'un palier (50, 100, 365 jours)
- Confetti animés (utiliser `canvas-confetti` ou réimplémenter — actuellement statique dans les mocks)
- Card orange-tint plus grande, badge palier débloqué
- Vibration légère mobile (Haptics API)

### Reprise après échec / pause
- **Pas de modale de honte.** Si la série casse, simple message en haut du dashboard : « nouvelle série démarre aujourd'hui » avec un CTA neutre.
- Le record perso (best) est toujours visible dans le profil.

### Recalcul MBR
- Modal step-by-step (à mocker) : nouveau poids → nouvelle activité (optionnel) → résultat avec slider d'objectif.
- Permettre d'écraser l'ancien plan. Garder l'historique des MBR dans une table `mbr_history`.

### Animations

| Élément | Propriété | Durée | Easing |
|---|---|---|---|
| ProgressRing fill | `stroke-dashoffset` | 1100ms | `cubic-bezier(.2,.7,.2,1)` |
| Over-arc rouge | idem | 1100ms (delay 150ms) | idem |
| Field focus ring | `border-color`, `box-shadow` | 120ms | linear |
| StepBar progress | `background` | 240ms | linear |
| ActivityCard select | `border-color`, `background` | 140ms | linear |
| BottomNav tab active | couleur | 100ms | linear |

### Responsive

- Mobile-first : design à 390px de large
- Tablet (≥ 768px) : Dashboard mobile reste avec navigation bottom, mais containers centrés max-width 480px
- Desktop (≥ 1024px) : bascule sur la mise en page sidebar + grid (`DashboardDesktop`, `WeeklyDesktop`, etc.)
- Le dark mode suit `prefers-color-scheme` par défaut, override dans Profil

### États de validation

- Email : regex standard, erreur sous le champ « format invalide »
- Password : min 8 caractères
- Onboarding âge : 13–100, taille : 100–230 cm, poids : 30–300 kg
- Stepper : valeur min 0, pas de max strict

---

## State management

### Stores (Zustand recommandé, ou Context + reducer)

```ts
type UserStore = {
  profile: { age, height, weight_start, weight_current, gender, activity }
  calculations: { mbr, tdee, target_kcal, deficit_pct }
  streak: { current, best, last_confirmed_date }
}

type DayStore = {
  byDate: Record<string /*YYYY-MM-DD*/, {
    calories_in: number
    calories_burned: number
    steps: number
    confirmed: boolean
    weight?: number
  }>
}
```

### Calculs (formules Mifflin-St Jeor recommandées)

```ts
// MBR Mifflin-St Jeor
mbr_h = 10*kg + 6.25*cm - 5*age + 5
mbr_f = 10*kg + 6.25*cm - 5*age - 161

// TDEE
const factors = { sed: 1.2, leg: 1.375, mod: 1.55, tre: 1.725, ext: 1.9 }
tdee = mbr * factors[activity]

// Objectif suggéré : déficit modéré 15-20% du TDEE, plafonné à -25% du MBR
target = Math.max(mbr * 0.95, tdee - 500)
```

### Persistence

- IndexedDB via `idb-keyval` ou Dexie pour `byDate`
- LocalStorage pour profil + thème
- Sync optionnel vers Supabase si auth (table `entries` indexée par `user_id` + `date`)

---

## Assets

Aucun asset binaire requis. Toute l'iconographie est en SVG inline dans `kaloriim-ui.jsx` :
- Flame (drawn path)
- Check, Chevron (haut/bas/gauche/droite), Plus, Minus
- Nav icons (Ring, Bars, Report, User)
- Status bar iOS (signal, battery)

Les fonts sont chargées via Google Fonts dans `tokens.css`. En prod, utiliser `next/font` ou self-host pour la performance.

---

## Fichiers du bundle

```
design_handoff_kaloriim/
├── README.md                    ← ce fichier
├── kaloriim hi-fi.html          ← canvas avec tous les écrans (open in browser)
├── tokens.css                   ← variables CSS light + dark
├── kaloriim-ui.jsx              ← tous les composants partagés
├── dashboard-mobile.jsx         ← Dashboard 4 états + célébration
├── login.jsx                    ← Login mobile (3 modes) + desktop
├── onboarding.jsx               ← 3 étapes mobile + desktop
├── desktop-and-weekly.jsx       ← Dashboard desktop, Weekly mobile + desktop
├── bilan-profil.jsx             ← Bilan mobile, Profil mobile + desktop
└── design-canvas.jsx            ← shell de présentation (pas à porter)
```

**Pour visualiser** : ouvrir `kaloriim hi-fi.html` dans un navigateur. Pan/zoom sur le canvas, focus mode (clic sur une carte) pour voir un écran en plein.

**Pour porter** : lire chaque `.jsx` comme spec lisible. Les styles inline dans les composants sont les vraies valeurs à reprendre — utiliser `tokens.css` pour les couleurs/ombres/rayons via variables CSS ou Tailwind theme extend.

---

## À faire (non mocké, mais à prévoir)

- Empty states de Semaine et Bilan (première semaine sans données)
- Modal « Recalcul MBR » (step-by-step)
- Variante « série cassée — reprise douce » (juste un message en haut du dashboard, pas de modale)
- Onboarding desktop étape 1 (identique à l'étape 2/3 en sidebar — facile à dériver)
- Page « partager mon récap » (génération image OG ou lien public read-only)
- Notifications push (rappel saisie quotidienne, célébration palier)

## Copy / ton

- Tutoiement systématique
- Lowercase pour les titres marketing (« compte les bonnes choses. »)
- Sentence case pour les boutons et labels UI (« Confirmer ma journée », « Modifier mon profil »)
- Factuel, jamais culpabilisant : « dépassement de 250 kcal — pas grave » au lieu de « tu as échoué »
- Chiffres FR : espace insécable comme séparateur de milliers (`1 800` pas `1,800` ni `1.800`), virgule pour décimales (`82,4 kg`)
