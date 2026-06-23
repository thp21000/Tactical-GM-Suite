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

## Étape actuelle

L’étape prioritaire est :

```txt
Stats V2.1 — Base des trackers personnalisables
```

Cette étape doit se concentrer sur :

* le modèle de données des trackers ;
* les types visuels de trackers ;
* la bibliothèque interne simple d’icônes ;
* l’ajout, la modification et la suppression de trackers ;
* l’affichage en blocs verticaux repliables par token ou groupe ;
* les valeurs modifiables ou non selon le type de tracker ;
* une structure prête pour les presets futurs.

## À ne pas faire en V2.1

Ne pas développer maintenant :

* assignation joueur ;
* permissions joueur avancées ;
* conditions complètes ;
* menu clic droit des conditions ;
* affichage direct sur token ;
* mode placement autour du token ;
* automatisation complète PF2e ;
* calcul automatique de dégâts ;
* intégration Calendar ;
* intégration Loot Table.

## Règles d’architecture

Le code spécifique au module Stats doit rester dans :

```txt
src/features/stats/
```

Les types propres au module doivent rester dans :

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

## V2.1 implémentée — trackers personnalisables

La base Stats V2.1 est en place : le module utilise désormais un modèle `tokens + trackers` plutôt que des champs directs de type PV/CA sur l'entité suivie.

Inclus dans cette étape :

* ajout manuel d'un token suivi ;
* ajout depuis le menu contextuel Owlbear `Add to Stat Tracker` ;
* blocs verticaux repliables par token ou groupe simple ;
* trackers personnalisables avec cinq types visuels : icône, barre, compteur, lecture seule et toggle ;
* bibliothèque interne simple d'icônes textuelles ;
* migration robuste des anciens états V1 `entities` vers `tokens` + `trackers` ;
* sélecteurs internes pour permettre aux futurs modules de lire les trackers.

Restent volontairement reportés à des étapes ultérieures : presets automatiques, assignation joueur, conditions complètes et affichage direct sur token.
