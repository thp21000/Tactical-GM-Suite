# Tactical GM Suite — Stat Tracker Design System

Document de référence pour le module **Stats / Stat Tracker** de Tactical GM Suite, addon Owlbear Rodeo.

Emplacement recommandé dans le dépôt :

```txt
Tactical-GM-Suite/
  docs/
    stats/
      STAT_TRACKER_DESIGN_SYSTEM.md
```

## 1. Contexte

Tactical GM Suite est une suite MJ pour Owlbear Rodeo. Les modules actuels validés sont : Core / Dashboard, Initiative Tracker, Distance / Déplacement / Portée, et Stat Tracker. Calendar et Loot Table existent comme idées futures, mais sont reportés.

Ce document concerne uniquement le module **Stats / Stat Tracker**.

État validé du module Stats :

- Stats V2.1 : tokens suivis + trackers personnalisables.
- Stats V2.2A : presets internes appliqués selon le type de token.
- Stats V2.2B : gestion simple des presets par le MJ.
- Stats V2.3A : assignation joueur simple avec `assignedPlayerName` et `assignedPlayerId`.
- La suite concernant les permissions joueur avancées est gardée pour Codex plus tard.

L’objectif du présent document est de fixer le design system visuel des trackers, sans modifier le dépôt immédiatement.

## 2. Principe central

Un tracker est une donnée libre créée par le MJ. Le système ne doit jamais associer de manière obligatoire une icône à une statistique précise.

La règle principale est :

> Un tracker est une donnée libre. L’icône est un symbole libre. Le type de rendu est un comportement d’affichage. Le skin est une ambiance visuelle. Les presets ne sont que des raccourcis modifiables.

Conséquences :

- Une icône de cœur ne signifie pas automatiquement PV.
- Une icône de bouclier ne signifie pas automatiquement CA.
- Une icône de projectile ne signifie pas automatiquement munitions.
- Une icône de pièce ne signifie pas automatiquement monnaie.
- Le MJ peut utiliser n’importe quelle icône pour n’importe quelle stat.
- Le système ne doit pas bloquer les choix sémantiques du MJ, même s’ils semblent étranges.

## 3. Modèle conceptuel

| Concept | Rôle | Exemple |
|---|---|---|
| Tracker | Stat créée par l’utilisateur | PV, Munition, Stress, Dette, Poison, Piège |
| Visual Type | Manière d’afficher ou d’interagir avec la stat | `icon`, `bar`, `counter`, `readonly`, `toggle`, `units` |
| Icon | Symbole graphique choisi librement | cœur, projectile, crâne, pomme, sablier |
| Skin | Ambiance visuelle appliquée au tracker | rouge, acier, violet, or, neutre |
| State | État dynamique calculé | vide, plein, bas, actif, inactif, désactivé |
| Animation | Réaction visuelle légère | pop, flash, transition, fade |
| Preset | Configuration préremplie modifiable | PV, CA, Munitions, Charges |

Aucun de ces éléments ne doit imposer une signification de jeu aux autres.

## 4. Données actuelles du tracker

Un tracker peut déjà contenir notamment :

- `name`
- `visualType`
- `iconId`
- `current`
- `max`
- `value`
- `enabled`
- `visibility`
- `canPlayerEdit`
- `showOnToken`

Pour l’évolution visuelle, il est recommandé de prévoir éventuellement :

| Champ | Rôle | Remarque |
|---|---|---|
| `skinId` | Skin visuel choisi par l’utilisateur | Optionnel, fallback sur `neutral` |
| `displayOptions` | Options propres au visual type | Optionnel, pas nécessaire en première étape |

Il n’est pas recommandé de rendre `statId` obligatoire pour le système visuel, car le sens de la stat appartient à l’utilisateur. Les presets peuvent avoir des identifiants internes, mais l’affichage doit rester libre.

## 5. Visual Types

Les visual types sont des comportements d’affichage, pas des catégories de stats.

| Type | Rôle | Valeurs nécessaires | Icône libre ? |
|---|---|---|---|
| `icon` | Icône seule, badge optionnel | aucune ou `value` | Oui |
| `bar` | Progression actuelle / max | `current` + `max` | Oui |
| `counter` | Compteur modifiable | `value` ou `current` | Oui |
| `readonly` | Valeur fixe ou non modifiable rapidement | `value` ou `current` | Oui |
| `toggle` | Actif / inactif | booléen ou équivalent | Oui |
| `units` | Répétition de l’icône en unités | `current` + `max` | Oui |

## 6. Règle de liberté utilisateur

Le système doit respecter le visual type choisi par l’utilisateur, même si le résultat paraît peu optimal.

Exemples à accepter :

- `units` avec 30 icônes.
- `icon` pour une stat appelée PV.
- `bar` avec une icône de pomme.
- `toggle` avec une icône de projectile.
- `counter` avec une icône de cœur.

Le système ne doit pas remplacer automatiquement un rendu par un autre pour des raisons de lisibilité, de logique métier ou de cohérence supposée.

## 7. Fallbacks autorisés

Les fallbacks doivent exister uniquement pour éviter un rendu cassé, pas pour corriger un choix utilisateur.

| Situation | Comportement attendu |
|---|---|
| Icône absente ou introuvable | utiliser une icône générique |
| Skin absent ou introuvable | utiliser le skin `neutral` |
| Type inconnu | fallback `readonly` |
| Valeur absente pour `readonly` | afficher `—` |
| `bar` sans `max` | signaler une configuration incomplète ou empêcher la création dans le formulaire |
| `units` sans `max` | signaler une configuration incomplète ou empêcher la création dans le formulaire |
| Choix peu lisible mais techniquement valide | respecter le choix utilisateur |
| Max élevé avec `units` | afficher toutes les unités demandées |

Interdit :

- basculer automatiquement `units` vers `bar` parce que `max` est élevé ;
- regrouper automatiquement les unités sans option explicite ;
- refuser une icône parce qu’elle semble incohérente avec le nom de la stat ;
- imposer une couleur ou un skin en fonction du nom de la stat.

## 8. États dynamiques génériques

Les états dynamiques doivent être calculés à partir des valeurs et du type de rendu, pas à partir du nom de la stat.

| État | Rôle générique |
|---|---|
| `normal` | état standard |
| `empty` | valeur à 0 |
| `low` | valeur basse, si un seuil générique est utilisé |
| `partial` | valeur entre vide et plein |
| `full` | valeur égale au max |
| `overMax` | valeur supérieure au max |
| `increased` | valeur qui vient d’augmenter |
| `decreased` | valeur qui vient de diminuer |
| `active` | toggle actif |
| `inactive` | toggle inactif |
| `disabled` | tracker désactivé |
| `readonly` | visible mais non modifiable |
| `hidden` | non visible pour l’utilisateur courant |
| `invalid` | configuration techniquement incomplète |
| `fallback` | fallback technique utilisé |

Les états `increased` et `decreased` peuvent être temporaires côté UI pour déclencher des micro-animations.

## 9. Animations génériques

Les animations doivent être liées à l’action, pas au sens de la stat.

| Animation | Déclenchement | Types concernés |
|---|---|---|
| `value-pop` | valeur modifiée | `counter`, `readonly` |
| `increase-glow` | valeur augmentée | `bar`, `counter`, `units` |
| `decrease-flash` | valeur diminuée | `bar`, `counter`, `units` |
| `bar-transition` | remplissage modifié | `bar` |
| `unit-fill` | unité remplie ou vidée | `units` |
| `toggle-switch` | actif / inactif | `toggle` |
| `disabled-fade` | désactivation | tous |

Durées recommandées :

| Animation | Durée indicative |
|---|---:|
| pop valeur | 100 à 140 ms |
| flash baisse | 120 à 160 ms |
| glow hausse | 160 à 220 ms |
| transition barre | 120 à 180 ms |
| fade unité | 120 à 180 ms |
| toggle | 100 à 140 ms |

Les animations doivent rester légères. Le rendu doit rester compréhensible sans animation. Prévoir une compatibilité avec `prefers-reduced-motion`.

## 10. Rendus détaillés

### `icon`

`icon` affiche une icône seule, avec éventuellement un badge de valeur. C’est le type le plus compact.

Recommandations :

- icône 18 à 24 px dans un tracker compact ;
- badge de valeur optionnel ;
- opacité réduite si inactif ou désactivé ;
- fallback sur icône générique si l’icône manque.

### `bar`

`bar` représente une progression entre `current` et `max`.

Recommandations :

- icône à gauche ou dans le header du tracker ;
- texte `current / max` visible ;
- transition fluide du remplissage ;
- ne pas changer automatiquement le type si le choix est valide ;
- si `max` est absent, traiter comme configuration incomplète.

### `counter`

`counter` sert à modifier rapidement une valeur numérique.

Recommandations :

- boutons `-` et `+` en mode compact ;
- boutons `-5`, `-`, `+`, `+5` possibles en mode détaillé ;
- valeur centrale très lisible ;
- boutons masqués ou désactivés si l’utilisateur n’a pas le droit d’éditer.

### `readonly`

`readonly` affiche une valeur non modifiable rapidement.

Recommandations :

- valeur claire ;
- icône à gauche ;
- fallback général si le type est inconnu ;
- afficher `—` si la valeur manque.

### `toggle`

`toggle` affiche un état actif / inactif.

Recommandations :

- icône pleine ou lumineuse si actif ;
- icône atténuée si inactive ;
- interaction au clic seulement si autorisée ;
- sur token, icône seule recommandée.

### `units`

`units` répète l’icône choisie par l’utilisateur selon `current` et `max`.

Recommandations :

- une unité pleine pour chaque point disponible ;
- une unité vide ou atténuée pour chaque point manquant ;
- afficher le nombre d’unités demandé par `max`, sans seuil automatique ;
- ne jamais basculer automatiquement en barre ;
- si l’utilisateur choisit 30 unités, afficher 30 unités.

## 11. Rendu sur token

Le rendu sur token doit être plus compact que le popover. Il sert de résumé visuel, pas d’interface complète.

| Type | Rendu token recommandé |
|---|---|
| `icon` | icône seule, badge optionnel |
| `bar` | mini-barre + valeur optionnelle |
| `counter` | icône + valeur, sans gros boutons |
| `readonly` | icône + valeur |
| `toggle` | icône active / inactive |
| `units` | unités affichées selon configuration utilisateur |

Même sur token, il ne faut pas changer automatiquement le visual type choisi.

## 12. Presets internes

Les presets sont des modèles de création, pas des règles métier verrouillées.

Un preset peut préremplir :

- un nom ;
- un visual type ;
- des valeurs ;
- une icône ;
- un skin ;
- des options d’affichage.

Après application, le tracker doit rester entièrement modifiable.

Exemples de presets possibles :

| Preset | Préremplissage possible | Modifiable ? |
|---|---|---|
| PV | nom `PV`, type `bar`, icône cœur, skin rouge | Oui |
| CA | nom `CA`, type `readonly`, icône bouclier, skin acier | Oui |
| Munitions | nom `Munitions`, type `counter`, icône projectile, skin orange | Oui |
| Charges | nom `Charges`, type `counter` ou `units`, icône cristal, skin violet | Oui |
| Point héroïsme | nom `Point héroïsme`, type `units`, icône étoile, skin or | Oui |

## 13. Structure technique cible

Structure recommandée :

```txt
src/features/stats/
  design/
    iconLibrary.ts
    iconCategories.ts
    trackerSkins.ts
    visualTypes.ts
    trackerStates.ts
    trackerFallbacks.ts

  components/
    StatTrackerRenderer.tsx
    StatIconPicker.tsx
    StatSkinPicker.tsx
    StatPreview.tsx

  components/renderers/
    IconTrackerRenderer.tsx
    BarTrackerRenderer.tsx
    CounterTrackerRenderer.tsx
    ReadonlyTrackerRenderer.tsx
    ToggleTrackerRenderer.tsx
    UnitsTrackerRenderer.tsx

  assets/icons/
    body/
    arcane/
    resource/
    object/

  styles/
    stat-trackers.css
    stat-skins.css
    stat-animations.css
```

Les renderers doivent rester génériques. Ils ne doivent pas contenir de logique du type : `si PV alors rouge` ou `si CA alors bouclier`.

## 14. Ordre de développement recommandé

1. Stabiliser les fichiers de design system dans `docs/stats/`.
2. Stabiliser la bibliothèque d’icônes V1.
3. Ajouter les skins indépendants.
4. Ajouter ou améliorer les renderers existants.
5. Ajouter le visual type `units` si nécessaire.
6. Ajouter l’aperçu live dans l’écran de création.
7. Ajouter les micro-animations CSS.
8. Ajouter les fallbacks techniques.
9. Améliorer les presets sans les verrouiller.

