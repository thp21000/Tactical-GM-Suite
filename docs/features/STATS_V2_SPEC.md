# Cahier des charges — Stat Tracker V2

## Objectif général

Le module Stats doit devenir un système de suivi avancé des tokens, inspiré de l’addon Trackers d’Owlbear Rodeo, mais intégré à Tactical GM Suite.

Le but n’est pas de créer une fiche de personnage complète. Le but est de permettre au MJ de suivre rapidement des valeurs importantes liées aux tokens : PV, armure, ressources, compteurs, conditions, états, munitions, monnaie, sorts, points d’héroïsme, etc.

Chaque token suivi peut recevoir des trackers personnalisés. Ces trackers peuvent venir d’un preset, être ajoutés manuellement, être modifiés à la volée, et plus tard être affichés directement autour du token sur la scène.

## Types de tokens suivis

Un token suivi peut appartenir à l’un de ces types :

* PJ
* PNJ
* Ennemi
* Monture
* Objet
* Piège
* Familier
* Autre

Le type sert à appliquer un preset par défaut, mais le MJ doit pouvoir ensuite modifier librement les trackers du token.

## Regroupement de tokens

Le système doit permettre de regrouper ou lier plusieurs tokens ensemble.

Exemple : un PJ et sa monture.

Si deux tokens sont liés, sélectionner l’un des deux doit permettre d’afficher le même groupe de suivi. Le bloc de suivi doit pouvoir montrer les deux entités liées, avec leurs trackers respectifs.

Cela permet de gérer les cas comme :

* PJ + monture
* PJ + familier
* personnage + bouclier/token objet
* boss + éléments liés
* piège + mécanisme associé

Le regroupement ne doit pas fusionner toutes les stats. Chaque token garde ses trackers, mais ils peuvent être consultés ensemble dans un même bloc.

## Structure générale

Le module repose sur plusieurs niveaux :

### Token suivi

Un token suivi représente une entité liée à un token Owlbear.

Il contient :

* identifiant interne
* identifiant du token Owlbear
* nom
* type : PJ, PNJ, Ennemi, Monture, Objet, Piège, Familier, Autre
* trackers associés
* conditions associées
* visibilité
* lien éventuel avec un groupe
* lien éventuel avec un joueur, plus tard

### Groupe de tokens

Un groupe permet de lier plusieurs tokens ensemble.

Il contient :

* identifiant du groupe
* nom du groupe
* liste de tokens liés
* token principal optionnel
* ordre d’affichage

### Tracker

Un tracker est une stat ou ressource suivie.

Il contient :

* nom
* type visuel
* valeur actuelle
* valeur maximale optionnelle
* icône
* visibilité
* autorisation de modification
* affichage sur token activé ou non
* visibilité sur token : public / privé / MJ seulement
* position sur token, plus tard
* taille sur token, plus tard

### Preset de trackers

Un preset est une liste de trackers à appliquer automatiquement à un type de token.

Le MJ doit pouvoir créer, modifier et supprimer des presets dans les paramètres du module Stats.

## Types visuels de trackers

Le système doit gérer cinq types de trackers :

### 1. Icône seule

Utilisé pour une information présente/absente ou un marqueur simple.

Exemples :

* bouclier équipé
* état spécial
* marqueur narratif
* objet important

### 2. Barre à valeur maximale

Utilisé pour une valeur qui va de 0 à un maximum.

Exemples :

* PV
* PV temporaires
* bouclier
* endurance
* stress
* magie
* jauge de sort

Affichage attendu :

* icône
* barre horizontale
* valeur actuelle
* valeur maximale
* couleur selon état si nécessaire

### 3. Indicateur à valeur modifiable

Utilisé pour un compteur modifiable rapidement.

Exemples :

* PO
* munitions
* points d’héroïsme
* charges
* consommables
* compteurs divers

Affichage attendu :

* icône
* valeur
* boutons - / +
* boutons -5 / +5 si pertinent
* modification manuelle possible

### 4. Indicateur à valeur non modifiable

Utilisé pour une valeur informative.

Exemples :

* CA
* CA du bouclier
* solidité du bouclier
* niveau
* DD
* perception passive
* valeur calculée

Affichage attendu :

* icône
* nom
* valeur
* pas de boutons + / -

### 5. Toggle / case activable

Utilisé pour un état binaire.

Exemples :

* actif / inactif
* concentré / non concentré
* rechargé / non rechargé
* bouclier levé / non levé
* stance active / inactive

Affichage attendu :

* icône
* nom
* état activé/désactivé
* clic pour basculer si modification autorisée

## Bibliothèque d’icônes

Le module doit utiliser une bibliothèque interne simple d’icônes.

Chaque icône doit avoir :

* id
* nom
* catégorie
* représentation visuelle
* variantes possibles selon le type de tracker si nécessaire

Au départ, la bibliothèque peut utiliser des icônes simples, emojis ou SVG internes. Une version plus avancée avec assets graphiques pourra être faite plus tard.

Le MJ choisit seulement l’icône. Le système applique ensuite l’affichage adapté selon le type visuel du tracker.

## Presets par défaut

### Preset PJ

Trackers recommandés :

* PV
* PVT
* Bouclier
* CA
* Bouclier CA
* Bouclier Solidité
* PV bouclier
* Munitions
* PP
* PO
* PA
* PC
* Sort
* Point héroïsme
* Conditions

### Preset Ennemi

Trackers recommandés :

* PV
* PVT
* CA
* Sort
* Conditions

### Preset PNJ

Trackers recommandés :

* PV
* CA
* PVT
* Conditions

### Autres presets à définir plus tard

Les types suivants devront avoir des presets à définir ensuite :

* Monture
* Objet
* Piège
* Familier
* Autre

## Affichage dans l’addon

Le module Stats doit afficher les tokens suivis sous forme de blocs verticaux.

Chaque token ou groupe de tokens doit être affiché dans un bloc repliable.

Le MJ peut ouvrir ou fermer chaque bloc selon ses besoins.

Dans un bloc de token, on doit voir :

* nom du token
* type du token
* lien éventuel avec un autre token/groupe
* liste des trackers
* conditions
* boutons d’action MJ

Pour un groupe de tokens, le bloc doit afficher les entités liées dans le même ensemble.

Exemple :

Bloc : “Archis + Monture”

Contenu :

* Archis

  * PV
  * CA
  * Sorts
  * Conditions
* Monture

  * PV
  * CA
  * Endurance
  * Conditions

## Actions côté MJ

Le MJ peut :

* ajouter un token au suivi
* retirer un token du suivi
* choisir le type du token
* changer le preset appliqué
* ajouter un tracker
* modifier un tracker
* supprimer un tracker
* modifier les valeurs d’un tracker
* ajouter une condition
* supprimer une condition
* créer un groupe de tokens
* lier deux tokens
* délier deux tokens
* choisir si un tracker est visible sur le token
* choisir si l’affichage est public, privé ou MJ seulement
* plus tard, placer les trackers autour du token

## Actions côté joueur

Prévu pour une étape ultérieure.

Si un token est lié à un joueur connecté :

* le joueur voit uniquement le bloc qui lui est assigné
* le joueur peut modifier les trackers autorisés
* le joueur peut ajouter ou retirer certaines conditions si le MJ l’autorise
* le MJ conserve toujours les droits complets

Cette partie est prévue pour Stats V2.3, pas pour la V2.1.

## Conditions

Les conditions sont un système séparé des trackers, mais visible dans le bloc de suivi du token.

Une condition peut avoir :

* nom
* icône
* couleur
* groupe
* valeur optionnelle
* description optionnelle
* visibilité
* affichage sur token activé ou non
* position sur token, plus tard

Groupes par défaut :

* Conditions
* Buffs
* Extra

Le MJ pourra créer, modifier et supprimer des conditions dans les paramètres du module Stats.

L’ajout rapide de conditions pourra se faire plus tard via clic droit sur un token, avec une liste de conditions disponibles.

## Affichage sur token

Prévu pour une étape ultérieure.

Un tracker ou une condition pourra être affiché directement autour du token sur la scène.

L’affichage sur token doit être une version simplifiée :

* icône
* valeur
* barre courte si nécessaire
* aucun contrôle direct côté joueur
* visibilité publique, privée ou MJ seulement

Le MJ pourra activer un mode de modification pour choisir :

* position
* taille
* ordre
* ancrage autour du token

Cette partie est prévue pour Stats V2.5.

## Découpage en versions

### Stats V2.1 — Base des trackers personnalisables

Objectif :

Mettre en place le système de trackers personnalisables dans l’interface de l’addon.

Inclus :

* nouveau modèle de données pour trackers
* bibliothèque interne simple d’icônes
* types visuels de trackers
* ajout d’un tracker à un token suivi
* modification d’un tracker
* suppression d’un tracker
* affichage en blocs verticaux repliables
* valeurs modifiables selon type de tracker
* valeurs non modifiables selon type de tracker
* structure prête pour presets

Non inclus :

* assignation joueur
* affichage sur token
* conditions avancées
* menu clic droit des conditions
* placement visuel autour du token

### Stats V2.2 — Types de token et presets automatiques

Objectif :

Appliquer automatiquement des trackers selon le type de token.

Inclus :

* choix du type : PJ, PNJ, Ennemi, Monture, Objet, Piège, Familier, Autre
* presets de trackers par type
* changement de preset à la volée
* ajout/retrait de trackers après application du preset
* gestion des presets dans Paramètres

### Stats V2.3 — Assignation joueur

Objectif :

Permettre à un joueur de voir et modifier les trackers autorisés de son propre token.

Inclus :

* liaison token ↔ joueur connecté
* visibilité joueur limitée à son bloc
* droits de modification par tracker
* MJ conserve tous les droits

### Stats V2.4 — Conditions

Objectif :

Créer un système complet de conditions.

Inclus :

* bibliothèque de conditions
* groupes : Conditions, Buffs, Extra
* ajout/retrait depuis la fiche du token
* ajout rapide via clic droit sur token
* conditions à valeur optionnelle
* visibilité
* préparation affichage sur token

### Stats V2.5 — Affichage sur token

Objectif :

Afficher certains trackers et conditions directement autour du token.

Inclus :

* affichage public / privé / MJ seulement
* version simplifiée sans contrôles
* mode placement MJ
* taille, position, ordre
* synchronisation avec les valeurs de tracker

## Règle importante d’architecture

Les valeurs suivies doivent être exploitables par les autres modules de Tactical GM Suite.

Exemples futurs :

* Initiative peut lire les PV pour signaler un ennemi vaincu.
* Combat peut appliquer des dégâts à un tracker PV.
* Distance peut utiliser certaines valeurs de vitesse ou portée.
* Conditions peuvent influencer les affichages tactiques.

Il faut donc prévoir une structure de données claire, stable et accessible aux autres modules via des services internes.
