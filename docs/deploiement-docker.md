# Déploiement Docker

La stack contient PostgreSQL 17, une tâche de migration, l'API Node.js et Caddy pour l'interface React et HTTPS. Seul Caddy publie des ports. Les chemins `/api/*`, `/auth/*` et `/uploads/*` sont transmis à l'API sans réécriture. Le client utilise la même origine que le site.

## Réseau privé

Le réseau `private`, déclaré avec `internal: true` dans `docker-compose.yaml`, relie les trois services permanents `web`, `server` et `database`. La tâche temporaire `migrate` y est également raccordée pour préparer la base avant le démarrage de l'API. Les services se joignent par leur nom Docker : Caddy utilise `server:3000` et l'API utilise `database:5432`.

L'API et PostgreSQL ne publient aucun port et n'ont pas d'accès sortant à Internet. Les envois d'e-mails SMTP, les webhooks Discord et les notifications push vers des fournisseurs externes sont donc bloqués, même si leurs paramètres sont renseignés. Seul Caddy est aussi raccordé au réseau `public`, pour recevoir les visiteurs sur les ports publiés et obtenir ou renouveler les certificats HTTPS.

Ces réseaux sont propres au projet Compose et ne sont pas partagés avec les autres stacks. Cette isolation ne protège pas contre un administrateur de l'hôte ou une personne ayant accès au moteur Docker, qui peut raccorder d'autres conteneurs au réseau.

## Configuration

Utiliser Docker Engine et Docker Compose v2. Depuis la racine du projet, copier `.env.docker.example` vers `.env.docker` si ce dernier n'existe pas encore. Ne pas écraser un fichier déjà configuré.

Renseigner trois secrets indépendants dans `POSTGRES_PASSWORD`, `JWT_SECRET` et `REFRESH_SECRET`. Générer chaque valeur avec `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Le fichier `.env.docker` est ignoré par Git et exclu des images. Le mot de passe PostgreSQL est encodé au démarrage pour accepter les caractères spéciaux.

Les paramètres d'exemple préparent le déploiement public sur https://24hsolidaires.fr :

```dotenv
SITE_ADDRESS=https://24hsolidaires.fr
PUBLIC_SITE_URL=https://24hsolidaires.fr
HTTP_BIND=0.0.0.0
HTTP_PORT=80
HTTPS_PORT=443
```

Faire pointer l'enregistrement DNS A de `24hsolidaires.fr` vers l'adresse IPv4 publique du serveur. Si un enregistrement AAAA existe, il doit également pointer vers ce serveur avec une connectivité IPv6 fonctionnelle. Rendre les ports TCP 80 et 443 accessibles et, si nécessaire, les rediriger depuis le routeur vers l'hôte Docker. Aucun autre serveur ne doit occuper ces ports.

Caddy obtient et renouvelle automatiquement le certificat public, puis redirige HTTP vers HTTPS. Le volume `caddy_data` conserve les certificats et le compte ACME entre les redémarrages. Caddy garde son accès Internet via le réseau `public` ; l'API et PostgreSQL restent isolés. `PUBLIC_SITE_URL` doit être l'origine exacte, sans chemin ni barre oblique finale. Les cookies d'authentification sont sécurisés en production. La configuration suppose que Caddy reçoit directement le trafic public ; l'ajout d'un CDN ou d'un autre proxy nécessite de configurer explicitement les proxies de confiance.

Pour un test HTTPS local, utiliser `SITE_ADDRESS=https://localhost`, `PUBLIC_SITE_URL=https://localhost` et `HTTP_BIND=127.0.0.1`, en conservant les ports 80 et 443. Caddy délivre alors un certificat local : son autorité doit être approuvée sur la machine du navigateur, car un conteneur ne l'installe pas automatiquement sur l'hôte.

Les variables optionnelles `SMTP_*`, `VAPID_*` et `DISCORD_WEBHOOK_URL` ne suffisent pas à activer les notifications externes avec cette configuration isolée : leur utilisation nécessiterait aussi d'autoriser explicitement une sortie réseau pour l'API.

## Construire et démarrer

```sh
docker compose --env-file .env.docker config --quiet
docker compose --env-file .env.docker up -d --build --wait --wait-timeout 180
docker compose --env-file .env.docker ps -a
```

La tâche `migrate` attend PostgreSQL, applique les migrations versionnées, puis initialise uniquement les rôles requis par l'application. Elle se termine avec le code 0 avant le lancement de l'API. Au démarrage, l’API crée un administrateur à partir de ADMIN_EMAIL, ADMIN_LOGIN et ADMIN_PASSWORD si aucun administrateur n’existe. Le mot de passe (16 à 72 caractères) est haché ; un compte existant n’est jamais modifié. Une adresse déjà utilisée par un non-administrateur bloque la création. Aucun jeu de données de démonstration n’est créé. Le seed de développement ne doit pas être exécuté automatiquement en production.

L'API fonctionne avec un utilisateur non root et les seules dépendances de production. Les journaux de production sont au format JSON. Caddy transmet les adresses des visiteurs à l'API, qui ne fait confiance qu'au proxy directement adjacent et n'est pas publiée sur l'hôte.

Vérifier que `http://24hsolidaires.fr` redirige vers `https://24hsolidaires.fr` et que le navigateur accepte le certificat sans avertissement. Vérifier ensuite la page d'accueil, une URL interne telle que `/programme`, `/health`, `/api/games`, puis l'inscription et la connexion. Pour les erreurs :

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

Références : [HTTPS automatique de Caddy](https://caddyserver.com/docs/automatic-https), [ordre de démarrage Compose](https://docs.docker.com/compose/how-tos/startup-order/), [variables Vite à la compilation](https://vite.dev/guide/env-and-mode).
