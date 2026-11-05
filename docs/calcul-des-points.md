# Paramétrage des points

Source : `info des paramétrages de points.pdf`, pages 1 et 2. Les valeurs non fournies dans le document sont configurables, conformément au choix de l'organisation. Aucun montant laissé « X » dans le PDF n'est présenté comme un barème officiel.

## Utilisation

Dans Administration → Types de partie, créer ou modifier un mode, choisir « Barèmes événement », puis sélectionner la méthode. Renseigner les points, objectifs et coefficients. Les montants initialisés à zéro doivent être définis avant l'ouverture de l'événement. Activer « Mode équipe » pour pouvoir déclarer plusieurs participants dans une seule session, y compris un lobby TFT, un mini-jeu ou un import collectif.

Les coefficients utilisent le nombre de participants **inscrits sur la plateforme et sélectionnés dans la déclaration**, auteur compris. Une liste vide signifie coefficient 1 ; dès que des lignes sont définies, une taille de groupe absente du barème est refusée. Un mode nommé peut appliquer un coefficient supplémentaire, par exemple solo/duo/escouade ou difficulté.

Une personne déclare la partie et ses coéquipiers. Les calculs sont effectués côté serveur à partir du barème enregistré. Les données, le barème et le multiplicateur happy hour sont conservés dans la déclaration ; une modification administrative ultérieure ne change pas une partie déjà soumise. La validation est automatique à la déclaration ; un rejet ultérieur retire les points. La modération affiche les résultats par participant et les points réellement attribués après plafonnement.

## Méthodes disponibles

| Méthode | Calcul |
| --- | --- |
| Affrontement (LoL/FPS/Rocket/FIFA) | Points victoire ou défaite × coefficients du groupe et du mode. |
| Run (Gunfire/WoW) | Base victoire/défaite × (1 + difficulté × progression linéaire optionnelle), plus points du niveau de difficulté s'ils sont définis, puis coefficients. Le niveau 0 est le niveau de base. |
| Hadès | Base victoire/défaite × (1 + difficulté × progression linéaire). À cela s'ajoute soit le bonus de première victoire depuis zéro, soit la somme des ressources × leurs valeurs. Puis coefficients. Une défaite ne peut pas réclamer une première réussite. |
| Hunt | Base victoire/défaite + ressources valorisées au tarif victoire ou défaite. En cas de défaite, ajout du premier palier dont la durée maximale couvre le temps déclaré ; au-delà du dernier palier : zéro bonus de durée. Puis coefficients. |
| Tetris / score | Score individuel × valeur par unité × coefficients du nombre de participants et du mode. Les résultats sont individuels : un gros score rapporte davantage. Le PDF ne fournissant pas la formule historique, cette progression proportionnelle est le choix configurable retenu. |
| PoE2 / Peak / Pokémon | Somme des quantités d'objectifs × valeur de chaque objectif, plus bonus final si déclaré, puis coefficients. Créer les types d'événements PoE2, biomes Peak ou badges Pokémon comme objectifs ; le bonus final couvre notamment la Ligue. |
| Clair Obscur | Somme des valeurs des paliers situés après le palier initial jusqu'au palier final inclus. Les paliers sont ordonnés, nommés et sans limite de 22 imposée (maximum technique 500). Une reprise / NG+ applique son multiplicateur. Le pactole s'ajoute à une progression complète du début au dernier palier sans reprise. |
| Battle Royale | Top 1 : maximum (60 par défaut). Sinon maximum × (1 − rang / total)², puis coefficients. Le rang et le total doivent utiliser la même unité : joueurs en solo, équipes pour un classement d'équipes. |
| TFT | Points du rang dans le mode choisi × coefficients du nombre de participants de l'événement et du mode. Chaque joueur du lobby a son propre résultat. Standard et Double Up ont des tables séparées, extensibles. |
| Simracing | Somme des mesures individuelles × valeur de chaque unité. Exemples à définir : secondes en course, kilomètres, tours. |
| Minecraft | Somme des succès individuels, puis coefficients. Si l'objectif commun est atteint, les participants ayant le score minimum partagent le pot configuré, à parts égales ou proportionnellement à leur score avant bonus. Sans participant éligible, aucun bonus n'est attribué. Plusieurs objectifs communs traités ensemble peuvent être agrégés dans ce pot ; il est distribué une seule fois pour ce mode. |
| Quiz / blind test / GeoGuessr | Pot = contribution par présence × nombre de participants × coefficients. Par défaut, 95 % sont partagés également entre tous (vainqueur inclus), et 5 % reviennent en supplément au vainqueur. La part du vainqueur est configurable. |

Pour les affrontements et résultats communs d'équipe, les points calculés sont **individuels**, attribués à chacun des membres. Les pots de mini-jeux et Minecraft sont **collectifs** et sont répartis, jamais recopiés intégralement pour chaque joueur. Les participants déclarés sont vérifiés par la modération ; une confirmation de présence issue de l'agenda n'existe pas encore dans ce dépôt.

### Paramétrer Tetris

Choisir « Score et classement (Tetris) ». Le champ « Points par unité de score » est un **taux de conversion**, pas le nombre de points à attribuer à une partie : pour convertir un score Tetris de 100 000 en 10 points événement, saisir `0.0001`. Un taux de `1` conserve le score brut. Les coefficients de participants et de mode, puis la happy hour, peuvent encore multiplier le résultat. Le joueur saisit le score affiché dans le jeu pour chaque participant ; aucun CSV n'est requis.

### Déclarer Clair Obscur

Définir les points de chaque palier et placer le boss de fin en dernier. Avec un bonus de fin positif, le formulaire demande « Histoire terminée (boss de fin vaincu) » : répondre « Non » pendant la progression. Le bonus exige « Oui », l'atteinte du dernier palier et un parcours continu depuis zéro, sans reprise / NG+. Atteindre le dernier palier configuré sans déclarer l'histoire terminée ne suffit plus. Les anciennes déclarations en attente sans ce champ conservent la règle implicite historique.

Un gain nul peut provenir de paliers configurés à zéro, d'un multiplicateur de reprise ou coefficient nul, ou d'un plafond épuisé. Vérifier les points réellement attribués dans le détail de modération, distincts du total calculé avant plafond. Le bonus obtenu grâce à l'historique des paliers est ajouté lors du crédit.

### Convention Battle Royale

Le PDF est légèrement contradictoire : la formule littérale au rang 1 sur 100 donnerait 58,806, mais le texte exige 60. L'implémentation suit ses exemples : exception explicite pour le premier, puis rang / total pour les autres. Sur 100 : top 1 = 60, top 25 = 33,75, top 50 = 15, top 99 = 0,006, top 100 = 0, avant coefficients.

## Imports

Les formulaires Simracing, Minecraft, Tetris et TFT permettent d'abord la saisie manuelle. La section repliée « Import CSV facultatif » propose un modèle construit à partir du barème et des participants sélectionnés. Le fichier utilise `;` ou `,` comme séparateur, le point comme séparateur décimal, un en-tête et une ligne par participant. Taille maximum : 1 Mo. Les fichiers ne contiennent que des identifiants et des nombres, sans champs de texte ni cellules entre guillemets.

Exemple avec des mesures configurées `temps` et `tours` :

```csv
userId;item_temps;item_tours
12;3600;24
34;1800;10
```

Les identifiants doivent correspondre exactement aux participants sélectionnés. Les succès Minecraft valent 0 ou 1 ; les autres mesures sont positives ou nulles. Le modèle ne dépend d'aucun format d'export propriétaire, puisqu'aucun exemple n'a été fourni. Il faut adapter les exports des jeux à ces colonnes. Les résultats importés restent modifiables dans les champs et sont soumis à la même modération que la saisie manuelle.

Déclarer les valeurs de **cette session uniquement**, et non un cumul incluant des résultats déjà récompensés. Ne pas importer deux fois une même course. La protection de validation empêche de créditer deux fois une déclaration ; elle ne peut pas reconnaître deux captures identiques ou deux exports de course soumis comme deux déclarations différentes sans identifiant externe fourni.

## Plafonds, historique et précision

- Le choix « Limiter par » permet de fixer soit un maximum de parties, soit un maximum de points par utilisateur et type de partie. Une valeur vide laisse le type illimité. Les nouveaux plafonds de points sont des entiers ; les anciens plafonds décimaux restent lisibles. Le plafond est appliqué après happy hour à la validation, et ne peut pas être dépassé par des validations simultanées. La dernière partie ne reçoit que le solde disponible ; une partie déjà en attente peut recevoir zéro si le plafond a été atteint entre-temps. Seuls les crédits de ce type comptent, hors bonus manuels. Les limites existantes au niveau du jeu restent applicables.
- Le champ « Maximum de parties par utilisateur » s'applique à chaque type de partie, quelle que soit sa méthode de calcul. Vide : illimité ; sinon, saisir un entier positif. Les déclarations en attente et validées comptent pour chaque participant, auteur ou coéquipier ; les refusées libèrent une place. Les anciennes parties créditées sans déclaration sont également comptées. Le contrôle est atomique pour empêcher les dépassements par soumissions simultanées. Le compteur couvre tout l'historique du type, sans remise à zéro quotidienne. Abaisser la limite ne supprime aucune partie existante ; cela bloque les nouvelles déclarations des joueurs ayant déjà atteint le maximum.
- Les nouvelles déclarations portent `scoringData.version = 2`. Chaque gain individuel positif est arrondi à l’entier supérieur une seule fois, après coefficients, bonus et happy hour, avant plafonds. Le mode Nombre utilise son produit brut dans cette version. Les corrections négatives conservent leur précision. Les déclarations sans version 2 gardent le calcul historique à six décimales, y compris l’arrondi historique du mode Nombre ; aucun crédit historique n’est réécrit.
- Le plafond configurable limite le total individuel **du jeu**, tous ses modes confondus, après happy hour. Pour une politique uniforme, définir le même plafond sur chaque mode concerné. Les bonus manuels indépendants du jeu n'entrent pas dans ce plafond.
- Version 2 : les parts des pots (mini-jeu, Minecraft, événements) sont calculées avant l’arrondi final individuel ; leur somme peut donc dépasser le pot initial. Les parts historiques restent réparties en millionièmes. Les points bloqués par un plafond ne sont pas redistribués. Un solde historique fractionnel est arrondi vers le bas pour les nouveaux crédits : avec 97,5 points déjà crédités sur un plafond de 100, une nouvelle déclaration reçoit au maximum 2 points, jamais 2,5 ni 3. Les anciens crédits restent inchangés.
- Première réussite Hadès : un seul bonus par participant et mode. Succès Minecraft : un seul crédit par code de succès, participant et mode. Les paliers Clair Obscur déjà récompensés ne peuvent pas être soumis à nouveau pour le même parcours (normal ou reprise).
- Pour Clair Obscur, déclarer un intervalle nouveau sans recouvrement ; le bonus de fin explicitement déclaré est aussi accordé lors du dernier intervalle si les validations précédentes forment une progression continue depuis zéro. Ce bonus lié à l’historique apparaît dans les points attribués après modération. Ne pas resoumettre les intervalles déjà crédités.
- L'attribution et la vérification du cumul sont effectuées dans une transaction sérialisable avec reprise en cas de conflit ; une contrainte unique couvre partie/joueur.
- Les anciennes parties en attente sans données détaillées conservent leur score enregistré. Les nouvelles déclarations sont recalculées lors de la validation à partir de leurs données et du barème conservé.

## Vérifications

Les tests couvrent les méthodes, les exemples BR, les résultats individuels, les erreurs de saisie, les imports CSV, la progression à 22 boss, la conservation des pots, les décimales en PostgreSQL, les plafonds concurrents, les validations concurrentes, les changements de barème et les bonus uniques.


## Diagnostic calculé → crédité et rapprochement historique

Pour chaque nouvelle validation, l’instantané conserve les parts brutes, le gain après happy hour (`calculated`), le gain arrondi demandé (`requested`), le crédit effectif (`score`) et les plafonds limitants avec leur cumul et solde. La modération distingue le total calculé avant plafonds du total réellement crédité. Le bonus de fin Clair Obscur accordé grâce aux intervalles précédents est inclus dans ces deux sources.

Un exemple Pokémon reproductible sans base : objectifs et Ligue donnent 30 points, le cumul du type est 98 sur un plafond de 100 ; le crédit est 2. Cela démontre un mécanisme possible, sans établir la cause d’un cas réel. Vérifier l’instantané et les crédits du participant avant toute conclusion ou correction.

`previewCredits(scoringData, userGames)` est l’outil d’aperçu en lecture seule exporté par le module partagé. Il compare uniquement les parts sauvegardées et les crédits fournis, sans recalculer les anciens barèmes et sans écriture. Pour un export de sessions déjà autorisé :

```ts
const preview = sessions.map(session => ({
  sessionId: session.id,
  participants: previewCredits(session.scoringData, session.userGames),
}))
```

Un écart sans détail de plafond historique reste à vérifier ; ce n’est pas une dette automatique. Un calcul absent est signalé comme indisponible. Aucun rattrapage historique ni migration n’est exécuté.

Les codes d’import des nouveaux objectifs et modes sont générés à partir du nom, sans dépendre de l’horloge, avec suffixe en cas de collision. Les codes déjà enregistrés sont conservés lors d’un changement de nom. Leur édition reste disponible dans les options avancées.
