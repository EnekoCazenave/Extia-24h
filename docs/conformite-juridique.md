# Retouches juridiques — Extia Gaming 24h

État au 16 octobre 2026. Cette note rassemble les informations communiquées par l’organisateur et les changements du site. La date de lancement n’est pas encore définie.

## Informations pour le registre d’Extia

| Question | Réponse disponible | Information restant à obtenir |
| --- | --- | --- |
| Entité organisatrice / responsable de traitement | Extia, selon confirmation de l’organisateur. | Dénomination sociale exacte et forme juridique, siège, SIREN / RCS et coordonnées de contact. Ne pas déduire « Extia SAS » du seul nom commercial. |
| Développement et hébergement | Hébergement par Extia, serveurs en France. Application React / Fastify / PostgreSQL présente dans ce dépôt. | Nom de la personne ou de l’équipe ayant développé et maintenant le site ; identification complète et coordonnées de l’entité d’hébergement ; périmètre et localisation des sauvegardes. |
| Âge minimum | 18 ans révolus. Confirmation obligatoire à l’inscription, également contrôlée par l’API ; aucune date de naissance collectée. | Vérifier la situation des éventuels comptes créés avant cette règle : leur majorité et leur acceptation du nouveau règlement ne sont pas déduites de l’ancienne case. |
| Images / streaming | L’organisateur indique que les utilisateurs du site ne sont pas diffusés sur les photos ou streams. | Faire appliquer cette règle aux prises de vue de l’événement. Le site propose des lecteurs externes YouTube et Twitch, indépendamment de toute diffusion des participants. |
| Destinataires externes | Aucun partage des données personnelles du site avec les partenaires ou associations bénéficiaires. | Les fournisseurs des lecteurs externes reçoivent des données après autorisation du visiteur. Inventorier tout autre prestataire avant de l’activer. |
| Dons | Aucun paiement ni traitement de données bancaires ou émission de reçus fiscaux par le site. Les dons éventuels passent par des liens externes. | Confirmer les plateformes bénéficiaires dans le contenu des liens de dons. |
| Lancement | Date inconnue à ce jour. | Communiquer la date d’ouverture des inscriptions et les dates de début / fin de l’édition. |

## Parcours livré

- Case obligatoire d’acceptation du règlement, distincte de la mention d’information renvoyant vers la politique de confidentialité.
- Case obligatoire de confirmation de majorité.
- Case statistiques facultative et non pré-cochée, sans effet sur l’inscription ou le classement de compétition.
- Provenance facultative : agence, alumni ou partenaire selon les groupes configurés. Le formulaire actuel ne possède pas de catégorie « étudiant » distincte ; le texte public décrit les catégories réellement disponibles. Le groupe sert aussi à rattacher les points collectifs.
- Retrait ou accord des statistiques en une action depuis le profil ; état mis à jour dans le compte et conservé en base avec sa date et la version de la mention.
- Comptes existants : consentement aux statistiques à `false` après migration, aucune acceptation rétroactive du règlement ni confirmation de majorité inventée.
- Indicateurs, rapport Excel et six exports CSV fondés sur le même périmètre de participants consentants. Aucune identité de joueur non consentant dans les équipes mixtes ou le champ gagnant d’un rapport ; pas de nom, prénom, email, preuve ou motif libre dans ces exports statistiques. Les classements et outils nécessaires à l’organisation restent indépendants de ce consentement.
- Le bilan général compte tous les comptes inscrits et tous les points (parties, événements, bonus individuels et collectifs), même sans consentement statistique. Il est présenté séparément des KPI facultatifs dans l’administration. Les effectifs des activités, les capacités restantes, les classements et les totaux par jeu ou groupe conservent également tous les participants. Ce bilan est destiné à la gestion de l’événement ; son affichage ne réintègre aucune donnée individuelle dans les rapports KPI.
- Classements publics et sélection des coéquipiers limités au pseudo : retrait des noms et prénoms des classements et de leurs réponses API ; l’annuaire accessible aux participants ne renvoie plus leurs noms ni leurs emails.
- Consentements aux lecteurs YouTube et Twitch recueillis séparément avant tout chargement du lecteur ; refus et retrait accessibles. Les choix sont conservés uniquement dans la mémoire de la page et disparaissent au rechargement. Le retrait désactive tous les lecteurs du fournisseur ; il ne peut pas effacer ses cookies tiers déjà déposés.
- Aucun outil de mesure d’audience ou pixel publicitaire propre au site identifié dans les sources. Les polices Montserrat et Nunito et leurs licences sont maintenant servies localement, sans requête à Google Fonts.
- Aucune fonctionnalité de réengagement pour les prochaines éditions ajoutée : aucun accord pour cette finalité n’est recueilli et les adresses ne doivent pas être réutilisées à cette fin. Si cette finalité est décidée ultérieurement, prévoir un consentement et une durée spécifiques.

## Documents publics

- `/politique-de-confidentialite` : finalités et bases légales, champs obligatoires ou facultatifs et conséquences, mots de passe et connexion, visibilité publique, destinataires et transferts, limitation, retrait, directives après décès et paragraphe distinct sur l’opposition.
- `/reglement` : projet de conditions cohérent avec le fonctionnement de la plateforme et les réponses de l’organisateur. À faire valider avant ouverture des inscriptions.
- `/mentions-legales` : éditeur et hébergeur Extia, France ; les coordonnées manquantes et le directeur de publication sont explicitement signalés. Cette page ne constitue pas des mentions LCEN complètes tant que ces champs ne sont pas renseignés.

## Conservation et retrait

La conservation maximale retenue est la durée de l’événement puis 90 jours après sa clôture. Le site ne dispose pas actuellement d’une purge automatique : la mise à jour du texte public ne déclenche aucune suppression de données existantes.

Avant l’ouverture, désigner un responsable de la suppression et fixer l’échéance à partir de la date de clôture. Préparer la suppression des comptes et relations personnelles en base (participations, parties, preuves, points individuels, sessions, abonnements et traces d’envoi), des fichiers de preuve, des journaux et des copies d’exports. Intégrer les sauvegardes et leur rotation à la procédure et consigner l’exécution. Examiner séparément les données éventuellement nécessaires pour une obligation légale documentée avec le juridique, sans prolongation générale implicite.

Les nouveaux rapports tiennent compte du choix enregistré au moment de leur calcul. Un retrait ne peut pas rappeler automatiquement les fichiers déjà téléchargés : les détenteurs de ces exports doivent traiter la demande et supprimer ou recalculer leurs copies. Un téléchargement commencé avant le retrait peut encore refléter son état initial ; appliquer la même procédure à cette copie.

Pour conserver une comparaison annuelle après 90 jours, produire seulement des agrégats irréversiblement anonymes. Supprimer toute ligne individuelle, pseudo, identifiant et détail de session ; regrouper ou supprimer les petits effectifs et les combinaisons réidentifiantes. Un CSV ou classeur du site, même sans nom ni email, reste une donnée personnelle et ne constitue pas une archive annuelle anonymisée. Aucun export d’archive annuelle n’a été ajouté.

## Exploitation et déploiement

Appliquer la migration `20261016000000_separate_legal_choices` avant de déployer la nouvelle API, puis déployer le client correspondant. Elle ajoute uniquement des colonnes et ne supprime aucune donnée. Le nouveau formulaire attend `termsAccepted` et `adultConfirmed` ; l’ancienne case `consentAccepted` n’est pas suffisante. Ne pas maintenir simultanément un ancien formulaire d’inscription et cette API.

Les six CSV utilisent maintenant les en-têtes des feuilles du rapport et le périmètre des statistiques consenties ; adapter les éventuels traitements externes dépendant des anciens en-têtes. Les rapports ne sont plus un annuaire de coordonnées.

Les flux de notifications email / push / Discord existent dans le code. La stack Docker documentée isole l’API des accès sortants et les désactive de fait. Avant toute activation effective, inventorier le prestataire SMTP et les fournisseurs push, leurs lieux de traitement et garanties de transfert ; compléter la politique et le registre. Ne pas assimiler le consentement aux statistiques ou aux lecteurs vidéo à un accord de prospection.

## Sécurité — documentation interne

Les mots de passe sont hachés avec bcrypt et un coût de 12. Les cookies `access_token` et `refresh_token` sont `httpOnly`, `SameSite=Strict`, et `Secure` en production ; durées respectives de 900 et 604800 secondes. Les accès d’administration et les exports nécessitent le rôle administrateur. Les réponses des rapports sont marquées `Cache-Control: no-store`. Les statistiques utilisent une transaction à lecture cohérente. La version de la mention de consentement et du règlement livrée est `2026-10-16` ; la modifier lors d’un changement substantiel des textes, avec un nouveau recueil si nécessaire.

## Vérifications de la modification

Compilation complète réussie. Suites exécutées : 113 tests serveur réussis, 140 tests dans le workspace client réussis (dont une copie locale de la suite partagée détectée par Vitest), et 24 tests de calcul partagés réussis. Les essais serveur utilisent un cluster PostgreSQL temporaire et une base dédiée, avec les 17 migrations appliquées ; aucune migration ni suppression n’a été exécutée sur la base utilisée par le site.

Les tests couvrent le refus d’inscription sans règlement ou confirmation de majorité, l’inscription sans consentement statistique ni provenance, la conservation des choix datés, les équipes mixtes dans les CSV et Excel, le retrait sans perte de points ou d’inscription, l’absence de noms et emails dans les classements publics et l’annuaire des coéquipiers, ainsi que le blocage et le retrait des lecteurs vidéo. Le formulaire et la politique ont aussi été inspectés dans le navigateur.

Le lint global ne passe pas : erreurs préexistantes dans des tests et composants (notamment accessibilité de Modal, Navigationbar, EventForm, PlayGamePage et sous-titrage des vidéos personnalisées). Elles ne sont pas corrigées dans cette modification juridique.

## Sources officielles consultées

- [CNIL — Recueillir le consentement](https://www.cnil.fr/les-bases-legales/consentement).
- [CNIL — Droits des personnes](https://www.cnil.fr/fr/passer-laction/les-droits-des-personnes-sur-leurs-donnees).
- [CNIL — Cookies et contenus multimédias tiers](https://www.cnil.fr/fr/questions-reponses-lignes-directrices-modificatives-et-recommandation-cookies-traceurs).
- [Ministère de l’Économie — Mentions obligatoires d’un site internet](https://www.economie.gouv.fr/entreprises/developper-son-entreprise/innover-et-numeriser-son-entreprise/mentions-sur-votre-site-internet-les-obligations-respecter).
