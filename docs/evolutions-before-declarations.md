# Before, déclarations et programme

## Mise en service

Les migrations `20261105000000_before_participants` et
`20261105000200_declarations_programme_settings` sont à appliquer avec
`npm run db:deploy` lors de la mise en service autorisée. Elles ajoutent le
registre Before, les options du programme et les réglages d’accueil. Les bonus
existants sont conservés ; leur colonne de points accepte désormais les décimales.

Les preuves obligatoires sont désactivées par défaut. Après les tests, cocher
l’option correspondante dans l’administration, rubrique « Accueil et paliers ».
Le serveur contrôle aussi les déclarations en attente lors de leur validation :
une ancienne déclaration sans capture devra être complétée.

## Import Before

Dans l’administration, ouvrir « Import Before » et sélectionner le classeur
`.xlsx`. L’import lit uniquement l’onglet `participant`, sans en-tête : colonne A
au format `NOM Prénom` (noms composés en majuscules), colonne B pour les points.
Les résultats numériques enregistrés des formules sont utilisés sans exécuter
les formules ni accéder à leurs liens externes. Une cellule de points vide reste
vide et ne donne aucun crédit.

Utiliser le même identifiant de Before pour réimporter un fichier corrigé.
Un réimport identique ne crédite pas une seconde fois les participants. Les
montants différents nécessitent de cocher explicitement le remplacement des
scores ; le crédit existant est alors ajusté. Un montant numérique ne peut pas
être remplacé par une cellule vide. Un autre identifiant représente un autre
Before, dont les points s’ajoutent.

La correspondance utilise nom et prénom, en ignorant casse, accents et espaces
superflus. Une correspondance unique associe la ligne au compte et crédite les
points. Les lignes sans compte sont conservées puis récupérées automatiquement
lors de l’inscription. En présence de plusieurs comptes homonymes, la ligne
reste non associée pour éviter de créditer le mauvais compte. Les lignes déjà
associées ne sont pas réattribuées à un nouvel homonyme.

Les montants sont des bonus individuels : ils sont inclus dans les classements,
la fiche personnelle, les totaux et les exports existants. Le fichier source
fourni par l’organisateur n’est pas ajouté au dépôt.

## Déclarations

Le bouton d’accueil mène à `/declarer`, avec sélection du jeu et du mode.
L’historique personnel propose « Modifier » pour les déclarations modifiables
faites par l’utilisateur lui-même. Le formulaire reprend les valeurs, les
coéquipiers et la capture existante ; celle-ci peut être remplacée.

Le mode reste fixe lors d’une correction. La date, le barème et le multiplicateur
Happy Hour d’origine sont conservés. Les crédits sont remplacés atomiquement :
une correction invalide laisse l’ancienne déclaration et ses points intacts.
Une déclaration refusée corrigée reste en attente d’un nouveau contrôle, y
compris après plusieurs corrections successives.

Les déclarations déjà validées de progression, Hades et Minecraft ne sont pas
modifiables par ce parcours : leurs bonus ou paliers peuvent avoir servi aux
parties suivantes. Les déclarations refusées de ces modes restent corrigeables.

Lorsque les preuves sont obligatoires, la soumission et la validation exigent
une image effectivement uploadée et présente sur le serveur. Une URL libre ou
un nom de fichier inexistant ne suffit pas. Préserver le volume `uploads` lors
des mises à jour.

## Programme et accueil

Chaque événement peut nécessiter une inscription, avec ou sans attribution de
points, ou être en accès libre sans points. Les récompenses nécessitent des
inscriptions pour identifier les participants. La distribution reste manuelle,
après la fin et confirmation des présences.

Les événements existants gardent leur comportement. Les modalités de
participation sont figées après le début ; les inscriptions existantes empêchent
de transformer un événement en accès libre.

Le texte sous le grand logo se modifie dans « Accueil et paliers ». Un champ vide
utilise le texte d’accueil initial.

Les exports CSV utilisent un point-virgule comme séparateur, une virgule pour
les décimales numériques et des guillemets échappés pour préserver les textes,
virgules et retours à la ligne. Les exports Excel conservent leurs nombres typés.

## Vérification du 5 novembre 2026

- Builds shared, serveur et client réussis.
- Tests réussis : 216 serveur (dont 4 nouveaux tests API/base/upload),
  181 dans la commande client et 32 partagés.
- Les 20 migrations s’appliquent sur une base PostgreSQL 18 temporaire.
- Le fichier fourni passe l’import depuis le navigateur : 144 lignes conservées,
  dont une sans score. Association existante, inscription ultérieure et réimport
  sans doublon également vérifiés sur la base temporaire.
- Formulaire contrôlé aux largeurs ordinateur et mobile ; réglages d’accueil,
  import administratif et fiche d’événement libre contrôlés dans le navigateur.
- Revue indépendante réalisée ; corrections du multipart et du barème figé
  vérifiées après intégration.

Le contrôle de dérive Prisma relève une différence antérieure sur la clé étrangère
`EventChannelDelivery.eventId`. Ce modèle est identique à l’état initial de cette
intervention ; les nouvelles tables et colonnes n’ont pas de dérive détectée.
Aucune migration ni import n’a été exécuté sur la base applicative.
