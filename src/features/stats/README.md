# Stats module

Le module Stats gère le suivi des tokens dans Tactical GM Suite.

Ce module ne doit pas être traité comme une simple fiche de personnage complète. Il doit être développé comme un système de trackers personnalisables liés aux tokens Owlbear.

## Source de vérité

Avant toute modification majeure du module Stats, lire :

```txt
../../../docs/features/STATS_V2_SPEC.md
```

Le fichier `docs/features/STATS_V2_SPEC.md` est la source de vérité fonctionnelle pour Stats V2.

Aucune évolution importante du module Stats ne doit contredire ce document.

## Objectifs du module

Le module Stats doit permettre au MJ de :

* ajouter un token Owlbear au suivi ;
* suivre des valeurs personnalisables ;
* gérer des trackers visuels ;
* préparer les presets par type de token ;
* préparer les conditions ;
* préparer l’affichage futur sur token ;
* rendre les valeurs exploitables par les autres modules de Tactical GM Suite.

## Découpage Stats V2

Le développement doit respecter ce découpage :

* Stats V2.1 — Base des trackers personnalisables ;
* Stats V2.2 — Types de token et presets automatiques ;
* Stats V2.3 — Assignation joueur ;
* Stats V2.4 — Conditions ;
* Stats V2.5 — Affichage sur token.

Il ne faut pas implémenter plusieurs étapes en même temps sans validation explicite.

## État actuel

Les étapes actuellement implémentées sont :

```txt
Stats V2.1 — Base des trackers personnalisables
Stats V2.2A — Presets internes et application automatique
Stats V2.2B — Gestion simple des presets par le MJ
Stats V2.3A — Assignation joueur simple
Stats V2.3B — Permissions joueur préparées
Stats V2.3C — Mode joueur minimal / filtrage préparé
Stats V2.4A — Conditions, catalogue de base et assignation simple
Stats V2.4B — Durée, source, note et édition simple des conditions
Stats V2.4C — Effets mécaniques préparés
Stats V2.4D — Préparation affichage conditions sur token
Stats V2.5A — Aperçu local et modèle unifié d’affichage token
Stats V2.5B — Préparation synchronisation Owlbear en mode aperçu technique
Stats V2.5C — Plan de rendu overlay Owlbear
Stats V2.5D — Rendu SVG local des overlays
Stats V2.5E — Adaptateur Owlbear préparé et garde-fous de synchronisation
```

## V2.1 implémentée — trackers personnalisables

La base Stats V2.1 est en place : le module utilise désormais un modèle `tokens + trackers` plutôt que des champs directs de type PV/CA sur l'entité suivie.

Inclus dans cette étape :

* ajout manuel d'un token suivi ;
* ajout depuis le menu contextuel Owlbear `Ajouter au Stat Tracker` ;
* blocs verticaux repliables par token ou groupe simple ;
* trackers personnalisables avec cinq types visuels : icône, barre, compteur, lecture seule et toggle ;
* bibliothèque interne simple d'icônes textuelles ;
* migration robuste des anciens états V1 `entities` vers `tokens` + `trackers` ;
* sélecteurs internes pour permettre aux futurs modules de lire les trackers.

## Stats V2.2A — presets internes

Les presets internes sont en place dans :

```txt
src/features/stats/services/statPresets.ts
```

Ils permettent d’appliquer automatiquement des trackers selon le type de token.

Types couverts :

* PJ ;
* PNJ ;
* Ennemi ;
* Monture ;
* Objet ;
* Piège ;
* Familier ;
* Autre.

Comportement actuel :

* l’ajout manuel d’un token applique le preset du type choisi ;
* l’ajout depuis le menu contextuel Owlbear applique un preset par défaut de type Ennemi ;
* le bouton `Appliquer preset` ajoute les trackers manquants du type actuel ;
* les trackers existants ne sont pas écrasés ;
* aucun doublon n’est créé si un tracker du même nom existe déjà.

## Stats V2.2B — gestion simple des presets

Les presets sont désormais stockés dans l’état Stats.

Le MJ peut :

* ouvrir le panneau `Gérer les presets` ;
* sélectionner un type de token ;
* ajouter un tracker au preset sélectionné ;
* retirer un tracker d’un preset ;
* réinitialiser un preset ;
* réinitialiser tous les presets.

Cette étape reste volontairement simple.

Les presets modifiés s’appliquent aux prochains tokens ajoutés et au bouton `Appliquer preset`.

Le bouton `Appliquer preset` reste prudent : il ajoute les trackers manquants et ne supprime pas les trackers déjà présents sur le token.

## Stats V2.3A — assignation joueur simple

Les tokens suivis peuvent maintenant recevoir une assignation joueur manuelle.

Champs ajoutés au token :

* `assignedPlayerName` ;
* `assignedPlayerId`.

Le MJ peut renseigner ces champs depuis le formulaire de token.

Le bloc token affiche ensuite le joueur assigné.

Cette étape ne met pas encore en place :

* la récupération automatique des joueurs connectés Owlbear ;
* le filtrage automatique côté joueur ;
* les permissions réelles par joueur ;
* l’édition directe côté joueur.

Ces éléments restent prévus pour une étape ultérieure de V2.3.

## Ce qui reste reporté

Restent volontairement reportés à des étapes ultérieures :

* permissions joueur réelles ;
* récupération des joueurs connectés Owlbear ;
* conditions avancées avec effets mécaniques ;
* affichage direct sur token ;
* automatisation complète PF2e ;
* intégration Calendar ;
* intégration Loot Table.

## Règles d’architecture

Le code spécifique au module Stats doit rester dans :

```txt
src/features/stats/
```

Les services de logique métier doivent rester dans :

```txt
src/features/stats/services/
```

Les hooks Owlbear propres au module doivent rester dans :

```txt
src/features/stats/hooks/
```

Les composants propres au module doivent rester dans :

```txt
src/features/stats/components/
```

Les composants partagés ne doivent aller dans `src/shared/components/` que s’ils sont réellement génériques.

## Règle importante

Les valeurs suivies par Stats doivent pouvoir être reprises plus tard par les autres modules.

Exemples futurs :

* Initiative peut lire les PV pour signaler une entité vaincue ;
* un module Combat peut appliquer des dégâts à un tracker PV ;
* Distance peut lire une valeur de vitesse ou portée ;
* les conditions peuvent influencer des affichages tactiques.

Il faut donc garder une structure de données claire, stable et exploitable.

## Stats V2.3B — permissions joueur préparées

Les règles de permissions joueur sont maintenant centralisées pour les trackers Stats.

Règles de visibilité préparées :

* `gm` = visible seulement par le MJ ;
* `public` = visible par tout le monde ;
* `private` = visible par le MJ et par le joueur assigné au token ;
* si aucun joueur n’est assigné au token, `private` reste visible uniquement par le MJ.

Règles d’édition joueur préparées :

* un tracker `gm` n’est jamais éditable par un joueur ;
* un tracker `public` ou `private` peut être édité par le joueur assigné si `canPlayerEdit` vaut `true` ;
* un token sans joueur assigné n’est jamais éditable par un joueur ;
* le MJ conserve tous les droits dans l’interface actuelle.

Cette étape prépare seulement les fonctions de permissions et les badges courts dans l’UI MJ (`MJ`, `Public`, `Privé`, `Joueur mod.`, `Lecture seule`).
La récupération automatique des joueurs Owlbear, le filtrage complet de l’interface et la vraie interface joueur restent reportés.

## Stats V2.3C — mode joueur réel minimal / filtrage préparé

Les règles de permissions préparées en V2.3B sont maintenant utilisées pour construire une vue filtrée selon le viewer courant.

Comportement préparé :

* le viewer Stats est centralisé dans un hook dédié ;
* le MJ voit tous les tokens et tous les trackers ;
* un joueur ne voit jamais les trackers `gm` ;
* un joueur voit les trackers `public` ;
* un joueur assigné au token voit aussi les trackers `private` de ce token ;
* si aucun tracker n’est visible pour un joueur, le token peut être masqué dans cette vue ;
* les contrôles rapides de tracker sont préparés selon `canPlayerEdit` et l’assignation du token ;
* les boutons MJ restent masqués en vue joueur.

Le hook utilise l’API joueur Owlbear disponible (`OBR.player.getRole()`, `getId()`, `getName()` et `onChange()`) quand elle est prête. En dehors d’Owlbear ou en cas d’erreur API, l’interface reste volontairement en `Mode MJ` pour éviter de masquer des informations au MJ.

L’interface joueur complète, l’édition joueur avancée et l’affichage direct sur token restent reportés.

## Stats V2.4A — conditions, base et assignation simple

Une première base de conditions est maintenant disponible dans Stats.

Inclus dans cette étape :

* un catalogue simple de conditions fantasy / PF2e-compatible ;
* un stockage séparé des conditions dans `StatTrackedToken.conditions`, distinct des trackers ;
* l’ajout d’une condition à un token suivi par le MJ ;
* le retrait d’une condition active par le MJ ;
* l’affichage des conditions actives sous forme de badges courts dans le bloc du token ;
* une normalisation des anciens tokens sans `conditions` vers une liste vide ;
* une migration prudente des anciennes conditions simples quand elles correspondent au catalogue.

Cette étape n’applique aucun effet mécanique automatique. Les malus, durées avancées, sources, immunités, automatisation PF2e et affichage direct sur token Owlbear restent reportés.


## Stats V2.4B — durée, source, note et édition simple des conditions

Les conditions actives peuvent maintenant porter quelques informations de suivi supplémentaires tout en restant séparées des trackers.

Inclus dans cette étape :

* modification de la valeur d’une condition à valeur, par exemple `Effrayé 2` ;
* source courte optionnelle ;
* note courte optionnelle ;
* durée simple : manuelle, rounds, rencontre ou repos ;
* décrément manuel des rounds via `-1r` sans suppression automatique à 0 ;
* normalisation des anciennes conditions qui ne possèdent pas encore ces champs.

Cette étape n’applique toujours aucun effet mécanique automatique. L’automatisation PF2e, les interactions avec Initiative / Distance et l’affichage direct sur token Owlbear restent reportés.


## Stats V2.4C — effets mécaniques préparés

Certaines conditions possèdent maintenant des effets descriptifs exploitables plus tard par les autres modules.

Inclus dans cette étape :

* effets descriptifs dans les définitions de conditions ;
* cibles d’effet préparées comme CA, jets, perception, vitesse, actions, visibilité ou initiative ;
* modes d’effet préparés comme malus de statut, bonus, désactivation ou information ;
* badges compacts affichables au MJ dans l’éditeur de condition ;
* effets pouvant indiquer qu’ils dépendent de la valeur de la condition.

Ces effets sont purement informatifs pour le moment. Ils ne modifient automatiquement ni les trackers, ni la CA, ni les PV, ni la vitesse, ni l’initiative, ni les jets. L’automatisation PF2e, les interactions Initiative / Distance et l’affichage direct sur token Owlbear restent reportés.


## Stats V2.4D — préparation affichage conditions sur token

Les conditions actives peuvent maintenant porter une intention d’affichage futur sur token, sans créer d’overlay Owlbear réel.

Choix de conception : comme les trackers existants, les nouvelles conditions ne sont pas affichées sur token par défaut. Le MJ active explicitement l’intention d’affichage depuis l’éditeur de condition.

Inclus dans cette étape :

* intention `showOnToken` sur chaque condition active ;
* modes préparés : badge, icône ou masqué ;
* priorité d’affichage bornée de 0 à 100 ;
* indicateur compact `Token` dans la liste des conditions ;
* helpers purs pour récupérer et trier les conditions prévues pour affichage futur.

Aucun overlay Owlbear réel n’est créé, aucun item Owlbear n’est modifié et aucune synchronisation visuelle automatique n’est faite. L’affichage réel sur token reste prévu pour Stats V2.5.

## Stats V2.5A — aperçu local et modèle unifié d’affichage token

Les trackers et conditions prévus pour affichage token sont maintenant réunis dans un modèle commun, sans modifier Owlbear.

Inclus dans cette étape :

* service `statTokenDisplay.ts` qui produit une liste unifiée d’items d’affichage issus des trackers et des conditions ;
* modes d’aperçu préparés : badge, icône, barre ou valeur ;
* tri commun par priorité puis par label ;
* aperçu local compact `Aperçu token` dans chaque bloc de token ;
* limitation visuelle à six items avec un badge `+X` si nécessaire ;
* résumé local du nombre de trackers et conditions prévus pour affichage token.

Cet aperçu est seulement affiché dans l’interface Stats. Aucune API Owlbear de modification de token n’est appelée, aucun item Owlbear n’est modifié, aucune metadata de token n’est écrite et aucun overlay réel n’est créé. La synchronisation avec les tokens Owlbear reste reportée aux prochaines étapes de Stats V2.5.

## Stats V2.5B — préparation synchronisation Owlbear en mode aperçu technique

Un payload technique de synchronisation Owlbear est maintenant préparé en mode aperçu, sans créer d’overlay réel.

Inclus dans cette étape :

* service `statTokenSync.ts` qui transforme chaque token suivi en payload technique pur ;
* statuts de synchronisation `ready`, `not-linked` et `empty` ;
* aperçu MJ compact indiquant si le token est prêt, non lié Owlbear ou sans item token ;
* détail repliable listant les labels qui seraient synchronisés ;
* rapport dry-run `createDryRunStatSyncReport` pour préparer une future synchronisation.

Cette étape n’appelle aucune API Owlbear de modification de scène, ne crée aucun item Owlbear, n’écrit aucune metadata d’item et ne crée aucun overlay visible. La synchronisation réelle reste reportée aux prochaines étapes de Stats V2.5.

## Stats V2.5C — plan de rendu overlay Owlbear

Un plan de rendu overlay Owlbear est maintenant préparé à partir des payloads dry-run V2.5B, sans créer d’overlay réel.

Inclus dans cette étape :

* service `statTokenOverlayPlan.ts` qui transforme les payloads dry-run en plans d’overlay purs ;
* `overlayId` stable basé sur le token Owlbear source ;
* layout préparé avec ancre, limite d’items, espacement et dimensions ;
* style préparé avec variante compacte, opacité et taille de police ;
* positions relatives simples pour chaque item prévu ;
* aperçu MJ compact du plan et détail repliable des positions ;
* rapport pur `createOverlayPlanReport` pour les futurs écrans ou synchronisations.

Choix de conception : les payloads `not-linked` ne produisent pas de plan, tandis que les payloads `empty` produisent un plan vide afin d’indiquer que le token Owlbear est lié mais sans élément affichable.

Cette étape n’appelle aucune API Owlbear de modification de scène, ne crée aucun item texte/image/shape, n’écrit aucune metadata d’item et ne crée aucun overlay visible. La création réelle d’items Owlbear reste reportée aux prochaines étapes de Stats V2.5.

## Stats V2.5D — rendu SVG local des overlays

Un rendu SVG local est maintenant généré depuis les plans d’overlay V2.5C, sans créer d’overlay Owlbear réel.

Inclus dans cette étape :

* service `statTokenOverlaySvg.ts` qui produit une chaîne SVG pure depuis un plan d’overlay ;
* génération d’une data URL SVG exploitable plus tard par une image Owlbear ;
* échappement des labels, titres et symboles avant insertion dans le SVG ;
* calcul de taille selon les items et le layout du plan ;
* rendu simple des modes badge, icône, valeur et barre ;
* aperçu MJ local via une balise `img` alimentée par la data URL.

Cette étape n’utilise pas le DOM, n’appelle aucune API Owlbear de modification de scène, ne crée aucun item Owlbear, n’écrit aucune metadata d’item et ne synchronise rien sur la scène. La création réelle d’items Owlbear reste reportée aux prochaines étapes de Stats V2.5.

## Stats V2.5E — adaptateur Owlbear préparé et garde-fous de synchronisation

Un adaptateur pur prépare maintenant les images SVG pour une future création d’overlay Owlbear, sans écrire sur la scène.

Inclus dans cette étape :

* service `statTokenOverlayObrAdapter.ts` qui prépare les images SVG et les données futures d’overlay ;
* statuts de préparation `ready`, `not-linked`, `empty` et `invalid` ;
* constantes futures `STAT_OVERLAY_METADATA_KEY` et `STAT_OVERLAY_KIND` ;
* metadata future préparée avec token, source Owlbear, overlay et date de mise à jour ;
* diagnostic MJ compact indiquant si la synchronisation réelle serait possible ;
* rapport pur `createObrOverlayPreparationReport` pour les futurs écrans ou synchronisations.

Cette étape n’appelle aucune API Owlbear de modification de scène, ne crée aucun item Owlbear, n’écrit aucune metadata réelle et ne propose aucun bouton de synchronisation actif. La vraie synchronisation reste reportée à Stats V2.5F.
