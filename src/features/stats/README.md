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

## Ce qui reste reporté

Restent volontairement reportés à des étapes ultérieures :

* V2.2B — édition complète des presets par le MJ ;
* V2.3 — assignation joueur ;
* V2.4 — conditions complètes ;
* V2.5 — affichage direct sur token ;
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
