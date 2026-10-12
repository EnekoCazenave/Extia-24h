# Extia Gaming 24h

Application React / Fastify / PostgreSQL, organisée en trois workspaces npm : shared, server et client.

## Installation

Prérequis : Node.js 20 ou plus récent, npm 10 ou plus récent, PostgreSQL.

```sh
npm ci
```

Copier `.env.example` vers `.env` à la racine et renseigner la connexion PostgreSQL et les secrets. Ne pas remplacer un fichier `.env` déjà configuré. Le serveur lit son environnement depuis son répertoire de travail : mettre également sa configuration dans `packages/server/.env` ou fournir les variables au processus.

```sh
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

`db:deploy` applique les migrations versionnées. Pour créer une nouvelle migration pendant le développement : `npm run db:migrate`. Le seed initialise les rôles et les exemples prévus par le projet ; il n'est pas nécessaire lors de chaque démarrage.

Le lancement racine compile le package partagé puis surveille les trois workspaces en parallèle. Les compilations sont émises uniquement dans `dist`, jamais dans les sources. Les dépendances locales utilisent les liens des workspaces npm.

## Vérification et production

Pour le déploiement conteneurisé, suivre le [guide Docker](docs/deploiement-docker.md). La stack inclut PostgreSQL, les migrations, l'API et le serveur web avec HTTPS. Utiliser `docker compose --env-file .env.docker` pour charger sa configuration dédiée.

```sh
npm run build
npm test
npm run lint -w @extia-gaming/client
npm audit
npm run start -w @extia-gaming/server
```

Les tests serveur d'intégration nécessitent une **base de test dédiée**, migrée et initialisée avec les rôles. Définir `DATABASE_URL` pour cette base avant `npm test` (ou configurer `.env.test`). Les tests d'authentification existants suppriment les jetons de cette base : ne jamais les exécuter sur une base utilisée par les participants.

Les commandes de build et de test préparent les dépendances partagées dans le bon ordre. Pour tester seulement les calculs : `npm run test -w @extia-gaming/shared`.

## Points et état du projet

- [Guide d’exploitation : événements, groupes, CSV et notifications](docs/exploitation-24h.md)
- [Guide des calculs, paramétrage et imports](docs/calcul-des-points.md)
- [Vérification des notes de réunion du 4 septembre 2026](docs/verification-reunion-24h.md)

La migration `20261005000000_scoring_rules` ajoute les nouveaux barèmes, les scores décimaux, la trace du calcul et une contrainte contre les doubles crédits. Elle conserve les anciennes déclarations et les anciens barèmes. Si des doublons historiques existent pour un même couple partie/joueur, la création de la contrainte échoue explicitement : ils doivent être examinés avant le déploiement, sans suppression automatique de scores.
