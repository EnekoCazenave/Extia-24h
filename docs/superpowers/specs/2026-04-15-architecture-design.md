# Architecture Design — Extia Gaming 24h

**Date:** 2026-04-15
**Statut:** Approuvé
**Périmètre:** Architecture, Sécurité, SEO, Accessibilité (hors features métier)

---

## 1. Contexte

Site public pour l'événement gaming 24h d'Extia. Inscription ouverte à tous (internes et externes). Authentification JWT. Pas de SSR — React SPA avec SEO basique sur les pages publiques.

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Vite + React 18 + TypeScript + React Router v6 |
| Data fetching | TanStack Query + Axios |
| SEO | React Helmet Async |
| Backend | Fastify + TypeScript |
| ORM & migrations | Prisma |
| Base de données | PostgreSQL |
| Validation | Zod (schémas partagés) |
| Auth | JWT (access 15min + refresh 7j) |

---

## 3. Architecture monorepo

**Gestionnaire de paquets :** pnpm Workspaces

```
/
├── packages/
│   ├── client/
│   │   └── src/
│   │       ├── components/   # UI réutilisables
│   │       ├── pages/        # Composants de routes
│   │       ├── hooks/        # Custom hooks
│   │       ├── services/     # Appels API (Axios)
│   │       └── contexts/     # AuthContext
│   ├── server/
│   │   ├── src/
│   │   │   ├── plugins/      # cors, helmet, jwt, rate-limit, csrf
│   │   │   ├── routes/       # Déclaration des routes Fastify
│   │   │   ├── controllers/  # Logique métier
│   │   │   └── services/     # Couche Prisma (DB)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── migrations/
│   │       └── seed.ts
│   └── shared/
│       └── src/
│           ├── schemas/      # Schémas Zod (user, game, team…)
│           └── types/        # Types TS dérivés des schémas Zod
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

**Flux de données :** Client → Axios → Fastify route → Controller → Service Prisma → PostgreSQL.

Les schémas Zod du package `shared` valident les requêtes côté server et typent les réponses côté client automatiquement (via `z.infer<>`).

---

## 4. Sécurité

### 4.1 JWT

- Access token : durée 15 minutes, stocké dans cookie `httpOnly; Secure; SameSite=Strict`
- Refresh token : durée 7 jours, stocké de même, rotation à chaque renouvellement
- Table `RefreshToken` en base pour invalidation possible (logout, révocation)
- Jamais de JWT dans `localStorage` (vulnérable XSS)

### 4.2 Plugins Fastify

| Plugin | Rôle |
|--------|------|
| `@fastify/helmet` | Headers sécurité (CSP, HSTS, X-Frame-Options…) |
| `@fastify/cors` | Whitelist origines explicite (pas `*`) |
| `@fastify/rate-limit` | Anti brute-force — 10 req/min sur `/auth/*` |
| `@fastify/csrf-protection` | Protection CSRF sur routes mutantes (POST/PUT/DELETE) |

### 4.3 Passwords

- Hashage `bcrypt` avec salt rounds = 12
- Jamais stocker ni logger un mot de passe en clair

### 4.4 Validation

- Zod sur chaque route (body, params, query)
- Fastify rejette automatiquement les requêtes malformées (400)
- Typage strict TypeScript côté server — pas de `any`

### 4.5 Autorisation

- Middleware `authenticate` sur toutes les routes protégées
- Vérifie le JWT + charge `user.role` depuis la base
- Guards par rôle (admin / user) sur routes sensibles

### 4.6 Variables d'environnement

- `.env` non commité — `.env.example` commité avec clés vides
- Variables critiques : `JWT_SECRET`, `REFRESH_SECRET`, `DATABASE_URL`
- `pnpm audit` dans le pipeline CI

---

## 5. Base de données

### 5.1 Notes sur le schéma

- `User.login` : pseudo/identifiant affiché pendant l'événement (distinct de `email` qui sert à l'authentification)
- `User.intern` : `true` = employé Extia, `false` = participant externe
- `VideoGame.nom` : nom en français (issu du schéma source draw.io, à homogénéiser si besoin)
- `GameType.calcul` / `GameType.win` : chaînes libres décrivant la méthode de scoring et la condition de victoire — format exact à définir lors de la spec features

### 5.2 Prisma Schema

```prisma
model User {
  id            Int               @id @default(autoincrement())
  login         String
  password      String
  lastname      String
  firstname     String
  intern        Boolean           @default(false)
  email         String            @unique
  role          Role              @relation(fields: [roleId], references: [id])
  roleId        Int
  userGames     UserGame[]
  userTeams     UserTeam[]
  achievements  UserAchievement[]
  userEvents    UserEvent[]
  refreshTokens RefreshToken[]
}

model Role {
  id    Int    @id @default(autoincrement())
  name  String
  users User[]
}

model VideoGame {
  id             Int        @id @default(autoincrement())
  nom            String
  happyHourStart DateTime?
  happyHourEnd   DateTime?
  gameTypes      GameType[]
}

model GameType {
  id          Int        @id @default(autoincrement())
  name        String
  calcul      String
  win         String
  team        Boolean    @default(false)
  videoGame   VideoGame  @relation(fields: [videoGameId], references: [id])
  videoGameId Int
  teams       Team[]
  userGames   UserGame[]
}

model Team {
  id         Int        @id @default(autoincrement())
  gameType   GameType   @relation(fields: [gameTypeId], references: [id])
  gameTypeId Int
  members    UserTeam[]
}

model UserTeam {
  team   Team @relation(fields: [teamId], references: [id])
  teamId Int
  user   User @relation(fields: [userId], references: [id])
  userId Int
  @@id([teamId, userId])
}

model UserGame {
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  gameType   GameType @relation(fields: [gameTypeId], references: [id])
  gameTypeId Int
  @@id([userId, gameTypeId])
}

model Achievement {
  id          Int               @id @default(autoincrement())
  name        String
  description String?
  users       UserAchievement[]
}

model UserAchievement {
  user          User        @relation(fields: [userId], references: [id])
  userId        Int
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  achievementId Int
  @@id([userId, achievementId])
}

model Event {
  id         Int         @id @default(autoincrement())
  name       String
  userEvents UserEvent[]
}

model UserEvent {
  user    User  @relation(fields: [userId], references: [id])
  userId  Int
  event   Event @relation(fields: [eventId], references: [id])
  eventId Int
  @@id([userId, eventId])
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  expiresAt DateTime
}
```

### 5.3 Migrations

| Commande | Contexte |
|----------|----------|
| `prisma migrate dev` | Développement — génère et applique |
| `prisma migrate deploy` | Production — applique sans générer |
| `prisma db seed` | Données initiales |

### 5.4 Seed

Le seed insère :
- Rôles : `admin`, `user`
- Quelques `VideoGame` et `GameType` de départ pour les tests

---

## 6. SEO

Périmètre : pages publiques uniquement (accueil, programme, classement public…). Contenu derrière authentification non indexé — comportement attendu.

### 6.1 React Helmet Async

Chaque page définit :
- `<title>` unique
- `<meta name="description">`
- Open Graph : `og:title`, `og:description`, `og:image`
- `<link rel="canonical">`
- `<meta name="theme-color">` (couleur primaire charte graphique)

### 6.2 Fichiers statiques

| Fichier | Contenu |
|---------|---------|
| `public/robots.txt` | Autorise tout sauf `/admin`, `/dashboard`, `/api` |
| `public/sitemap.xml` | Pages publiques uniquement |

### 6.3 Structured Data

- Schema.org `Event` en JSON-LD sur la page principale → éligibilité Google Events
- Format : `<script type="application/ld+json">` injecté via Helmet

### 6.4 Bonnes pratiques HTML

- `<h1>` unique par page
- `alt` obligatoire sur toutes les images
- URLs sémantiques via React Router (`/jeux/league-of-legends` pas `/jeux/3`)

---

## 7. Accessibilité

**Cible : WCAG 2.1 niveau AA**

### 7.1 HTML sémantique

- Structure : `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`
- Actions → `<button>` ; navigation → `<a>` ; jamais `<div onClick>`
- `<label>` explicite lié à chaque `<input>`

### 7.2 ARIA

- `aria-label` / `aria-labelledby` sur composants sans texte visible (icônes, modals)
- `aria-live="polite"` sur zones de feedback dynamique (erreurs, succès)
- `role="alert"` sur messages d'erreur critiques
- Trap focus dans modals et drawers

### 7.3 Clavier

- Focus visible sur tous les éléments interactifs (outline CSS préservé)
- Ordre de tabulation logique
- `tabIndex` explicite uniquement si nécessaire

### 7.4 Contraste

- Ratio minimum 4.5:1 texte normal, 3:1 grand texte (WCAG AA)
- Information jamais véhiculée par couleur seule
- À vérifier manuellement contre la charte graphique PDF

### 7.5 Formulaires

- Erreurs liées au champ via `aria-describedby`
- `autocomplete` sur champs `email`, `username`, `current-password`

### 7.6 Outillage

| Outil | Usage |
|-------|-------|
| `eslint-plugin-jsx-a11y` | Détection statique en dev |
| `axe-core` | Tests automatisés accessibilité |
| NVDA / VoiceOver | Tests manuels avant release |

---

## 8. Variables d'environnement requises

```env
# Server
DATABASE_URL=postgresql://user:password@localhost:5432/extia_gaming
JWT_SECRET=<secret-fort-min-32-chars>
REFRESH_SECRET=<secret-fort-min-32-chars>
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173

# Client
VITE_API_URL=http://localhost:3000
```

---

## 9. Ce qui n'est PAS dans ce spec

- Features métier (inscription jeux, gestion équipes, scores, achievements…) → spec séparée
- Design UI détaillé → charte graphique PDF de référence
- CI/CD, déploiement → à définir ultérieurement
