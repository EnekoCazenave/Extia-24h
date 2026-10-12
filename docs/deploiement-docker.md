# Déploiement Docker

La stack contient PostgreSQL 17, une tâche de migration, l'API Node.js et Caddy pour l'interface React et HTTPS. Seul Caddy publie des ports. Les chemins `/api/*`, `/auth/*` et `/uploads/*` sont transmis à l'API sans réécriture. Le client utilise la même origine que le site.

## Configuration

Utiliser Docker Engine et Docker Compose v2. Depuis la racine du projet, copier `.env.docker.example` vers `.env.docker` si ce dernier n'existe pas encore. Ne pas écraser un fichier déjà configuré.

Renseigner trois secrets indépendants dans `POSTGRES_PASSWORD`, `JWT_SECRET` et `REFRESH_SECRET`. Générer chaque valeur avec `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Le fichier `.env.docker` est ignoré par Git et exclu des images. Le mot de passe PostgreSQL est encodé au démarrage pour accepter les caractères spéciaux.

Les paramètres d'exemple servent à une vérification locale sur http://localhost:8080. Pour un déploiement public, adapter :

```dotenv
SITE_ADDRESS=gaming.example.org
PUBLIC_SITE_URL=https://gaming.example.org
HTTP_BIND=0.0.0.0
HTTP_PORT=80
HTTPS_PORT=443
```

Faire pointer le DNS du domaine vers le serveur et rendre les ports TCP 80 et 443 accessibles. Caddy obtient et renouvelle automatiquement le certificat. `PUBLIC_SITE_URL` doit être l'origine exacte, sans chemin ni barre oblique finale. Les cookies d'authentification sont sécurisés en production : utiliser HTTPS pour l'exploitation. La configuration suppose que Caddy reçoit directement le trafic public ; l'ajout d'un CDN ou d'un autre proxy nécessite de configurer explicitement les proxies de confiance.

Les notifications restent désactivées tant que leurs paramètres optionnels ne sont pas fournis. Copier les variables `SMTP_*`, `VAPID_*` et `DISCORD_WEBHOOK_URL` nécessaires depuis `.env.example` dans `.env.docker`.

## Construire et démarrer

```sh
docker compose --env-file .env.docker config --quiet
docker compose --env-file .env.docker up -d --build --wait --wait-timeout 180
docker compose --env-file .env.docker ps -a
```

La tâche `migrate` attend PostgreSQL, applique les migrations versionnées, puis initialise uniquement les rôles requis par l'application. Elle se termine avec le code 0 avant le lancement de l'API. Aucun compte administrateur par défaut ni jeu de données de démonstration n'est créé. Le seed de développement ne doit pas être exécuté automatiquement en production.

L'API fonctionne avec un utilisateur non root et les seules dépendances de production. Les journaux de production sont au format JSON. Caddy transmet les adresses des visiteurs à l'API, qui ne fait confiance qu'au proxy directement adjacent et n'est pas publiée sur l'hôte.

Vérifier la page d'accueil, une URL interne telle que `/programme`, `/health`, `/api/games`, puis l'inscription et la connexion. Pour les erreurs :

```sh
docker compose --env-file .env.docker logs --tail 100 migrate server web
```

## Données existantes, sauvegarde et mise à jour

Les volumes `postgresql_data`, `uploads`, `caddy_data` et `caddy_config` conservent respectivement la base, les fichiers téléversés et les données de Caddy. Garder le même nom de projet Compose entre les déploiements pour réutiliser les mêmes volumes. Ne pas utiliser `down -v` sur un environnement à conserver.

Le volume PostgreSQL conserve le nom logique historique. Si une ancienne base est réutilisée, `POSTGRES_PASSWORD` doit correspondre au mot de passe **déjà présent dans cette base**. Changer la variable ne change pas le mot de passe d'un volume initialisé : organiser séparément sa rotation avant d'exposer le site. La base n'a désormais plus de port publié sur l'hôte ; les outils d'administration doivent passer par `docker compose exec database`.

Avant une mise à jour, sauvegarder PostgreSQL avec `pg_dump` ainsi que le volume des fichiers téléversés. Exemple de création d'une sauvegarde dans le conteneur puis de copie vers l'hôte :

```sh
docker compose --env-file .env.docker exec -T database pg_dump -U postgres -d extia_gaming -Fc -f /tmp/extia-gaming.dump
docker compose --env-file .env.docker cp database:/tmp/extia-gaming.dump ./extia-gaming.dump
```

Conserver les sauvegardes hors du serveur et vérifier leur restauration. Les anciens fichiers présents dans `packages/server/uploads` ne sont pas incorporés à l'image : les transférer explicitement dans le volume `uploads` avant une migration depuis un serveur hors Docker.

Après sauvegarde, relancer la commande `up -d --build --wait`. Une migration en échec bloque le démarrage de la nouvelle API ; consulter ses journaux et corriger la cause. Certaines migrations refusent volontairement des doublons historiques : ne pas supprimer automatiquement les données pour contourner ce contrôle. Un retour à une ancienne image ne suffit pas à annuler une migration de schéma.

Pour arrêter les conteneurs en conservant les données :

```sh
docker compose --env-file .env.docker down
```

Références : [ordre de démarrage Compose](https://docs.docker.com/compose/how-tos/startup-order/), [variables Vite à la compilation](https://vite.dev/guide/env-and-mode).
