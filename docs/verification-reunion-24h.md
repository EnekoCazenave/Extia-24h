# Audit après mise à jour de main

Base réauditée : `origin/main` / `335ccdf`, le 5 octobre 2026. Ce document remplace l’audit réalisé sur `test/less-docs`. Les ajouts fonctionnels de cette première reprise ont été retirés avant réapplication de npm et des méthodes de calcul.

## Présent dans main (à conserver)

Agenda journalier et programme, badges de statut, création/modification/suppression des événements, horaires et capacité, inscriptions tardives, modale de présence, liste et validation des participants, vidéo entre cagnotte et programme, Twitch à l’accueil, classement personnel avec historique paginé, jeux, filtres, CMS associations et modération.

## Écarts constatés avant les nouveaux développements

- Notifications : modèles et abonnement serveur existent, mais la cloche demande seulement la permission ; pas de service worker, abonnement navigateur ni envoi des rappels.
- Événements : points de participation enregistrés sans attribution ; pas de répartition 95/5 ni choix du gagnant. Retrait administratif d’un inscrit absent. Capacité exposée aux inscriptions simultanées. Validation administrative non limitée aux horaires.
- Twitch : lien présent à l’accueil, absent du programme.
- Historique personnel : filtre uniquement sur le déclarant, omet les coéquipiers ; détail des bonus et points événementiels absent.
- Groupes agence/alumni/partenaire et attribution manuelle sans compte : absents.
- Exports CSV KPI : absents.
- Période principale des 24 heures : pas de réglage global ; les horaires de chaque événement sont déjà configurables.
- Kanban : aucun outil livré dans le dépôt. La réunion l’attribue à Eneko.

Les emails sont une possibilité évoquée, pas une obligation décidée. Les objectifs financiers configurables ne sont pas demandés par ces notes : ils ne seront pas ajoutés dans cette reprise.

## Calculs et dépendances

La bascule vers npm et les méthodes du second PDF sont conservées. Les barèmes restent paramétrables conformément à la réponse de l’organisation ; voir `calcul-des-points.md`.

## État après implémentation sur main

| Écart | Résultat et preuve |
| --- | --- |
| Notifications incomplètes | Service worker, activation/désactivation par appareil dans le profil, envoi planifié, reprise et suppression des abonnements expirés. Tables et routes de main réutilisées. `notification-dispatch.service.ts`, `NotificationControls.tsx`. Clés VAPID nécessaires au déploiement. |
| Distribution des points événementiels | Présents uniquement, pot proportionnel, partage 95/5 configurable, vainqueur présent et crédit unique après la fin. `event-scoring.service.ts`. |
| Gestion des participants | Retrait administrateur, capacité protégée en concurrence et présence administrative limitée aux horaires. Service et fiche événement existants complétés. |
| Liens Twitch du programme | Champ dans le formulaire, lien dans la carte et la fiche événement. |
| Classement personnel | Historique existant étendu aux coéquipiers ; détail des bonus et points validés ajouté. |
| Groupes et points Before | Création/archivage, affiliation lors de l’inscription ou depuis le profil, crédit manuel avec motif, historique et classement. |
| Exports CSV | Six exports administrateur : participants, événements, présences, parties, points et groupes. |
| Période principale | Réglage administratif et filtre de l’agenda, inclusion facultative des Before. |
| Kanban | Tableau persistant dans l’administration, avec responsable et état. |

L’agenda, la vidéo, les routes d’événements, la modale de présence, la navigation responsive et le classement personnel de main ont été conservés. Aucun deuxième système équivalent n’a été installé. Le détail de mise en service figure dans `exploitation-24h.md`.

## Validation

Les douze migrations passent sur une base PostgreSQL 18 temporaire dédiée. La base applicative n’a pas été migrée. Compilation réussie et **221 tests réussis** : 24 partagés, 83 serveur et 114 client. Vérification navigateur sur données synthétiques : redirection après connexion, modale et confirmation de présence, fiche des participants, création de groupe et attribution de points.

Le lint global relève encore **17 erreurs et 4 avertissements**, dans des zones préexistantes de main (accessibilité, configuration de règle et tests). Les nouveaux composants ne produisent pas d’erreur de lint. Le build signale un bundle client supérieur à 500 ko. L’installation propre `npm ci` du 6 octobre 2026 réussit et signale **13 vulnérabilités** (6 modérées, 4 élevées, 3 critiques) ; aucune mise à jour majeure forcée n’a été effectuée.

Les anciennes dépendances `node_modules.previous` restent ignorées et inutilisées. Le contrôle automatique avait refusé leur suppression lors de la première bascule ; aucune suppression de remplacement n’a été tentée.
