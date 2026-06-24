# Tactical GM Suite — Stat Tracker Design System

Document de référence pour le module **Stats / Stat Tracker** de Tactical GM Suite, addon Owlbear Rodeo.

Emplacement recommandé :

```txt
Tactical-GM-Suite/docs/stats/STAT_TRACKER_DESIGN_SYSTEM.md
```

## 1. Contexte

Tactical GM Suite est une suite MJ pour Owlbear Rodeo.

Modules actuels validés :

1. Core / Dashboard
2. Initiative Tracker
3. Distance / Déplacement / Portée
4. Stat Tracker

Calendar et Loot Table existent comme idées futures, mais sont reportés.

Ce document concerne uniquement le design visuel du module **Stats / Stat Tracker**.

État validé du module Stats :

- Stats V2.1 : tokens suivis + trackers personnalisables.
- Stats V2.2A : presets internes appliqués selon le type de token.
- Stats V2.2B : gestion simple des presets par le MJ.
- Stats V2.3A : assignation joueur simple avec `assignedPlayerName` et `assignedPlayerId`.
- La suite code / permissions joueur avancées est gardée pour plus tard.

## 2. Règle centrale

Un tracker est une donnée libre créée par le MJ.

> Un tracker est une donnée libre. L’icône est un symbole libre. Le type de rendu est un comportement d’affichage. Le skin est une ambiance visuelle. Les presets ne sont que des raccourcis modifiables.

Conséquences obligatoires :

- Une icône de cœur ne signifie pas automatiquement PV.
- Une icône de bouclier ne signifie pas automatiquement CA.
- Une icône de projectile ne signifie pas automatiquement munitions.
- Une icône de pièce ne signifie pas automatiquement monnaie.
- Le MJ peut utiliser n’importe quelle icône pour n’importe quelle stat.
- Le système ne doit pas bloquer les choix sémantiques du MJ, même s’ils semblent étranges.
- Le système ne doit pas remplacer automatiquement un rendu valide par un autre.

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

Ajout recommandé :

| Champ | Rôle | Remarque |
|---|---|---|
| `skinId` | Skin visuel choisi par l’utilisateur | Optionnel, fallback `neutral` |
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

`units` signifie : répéter l’icône choisie par l’utilisateur selon `current` et `max`. Cela ne signifie pas “cœurs”.

## 6. Liberté utilisateur sur le rendu

Le système doit respecter le visual type choisi par l’utilisateur, même si le résultat paraît peu optimal.

Exemples à accepter :

- `units` avec 30 icônes.
- `icon` pour une stat appelée PV.
- `bar` avec une icône de pomme.
- `toggle` avec une icône de projectile.
- `counter` avec une icône de cœur.

Interdits :

- basculer automatiquement `units` vers `bar` parce que `max` est élevé ;
- regrouper automatiquement les unités sans option explicite ;
- refuser une icône parce qu’elle semble incohérente avec le nom de la stat ;
- imposer une couleur ou un skin en fonction du nom de la stat.

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

Le fallback recommandé pour les icônes est `object_circle`.

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

- rendu compact ;
- valeur claire ;
- fallback principal pour type inconnu ou rendu impossible ;
- afficher `—` si aucune valeur n’est disponible.

### `toggle`

`toggle` représente un état actif / inactif.

Recommandations :

- actif : icône pleine, bordure ou glow léger ;
- inactif : icône atténuée ;
- désactivé : opacité basse ;
- clic uniquement si l’utilisateur a le droit d’éditer.

### `units`

`units` répète l’icône choisie par le MJ.

Recommandations :

- `current` définit le nombre d’unités pleines ;
- `max` définit le nombre total d’unités ;
- ne pas limiter automatiquement le nombre d’unités ;
- ne pas grouper automatiquement ;
- afficher toutes les unités demandées si la configuration est valide.

## 11. Picker d’icônes V1

Le picker d’icônes doit permettre au MJ de choisir une icône librement.

Onglets validés :

| Onglet | Rôle |
|---|---|
| Récents | icônes utilisées récemment |
| Corps & Protection | vivant, blessure, défense, armure |
| Arcane & Combat | magie, énergie, armes, combat |
| Ressources & Richesses | consommables, équipement, monnaie |
| Objets & Marques | objets, mécanismes, pièges, marqueurs |

Règles :

- une icône appartient à une seule catégorie principale ;
- `Récents` est un onglet dynamique, pas une catégorie d’asset ;
- pas de recherche en V1 ;
- affichage en onglets + grille ;
- icônes 28 à 32 px dans la grille ;
- cellules autour de 40 à 44 px ;
- tooltip recommandé avec le nom visible de l’icône ;
- hover : pastille sombre translucide ;
- sélection : pastille plus visible + accent violet ou accent UI.

Changer d’icône ne doit jamais modifier le nom, le type, les valeurs ou le skin.

## 12. Skins V1

Les skins sont des ambiances visuelles libres appliquées autour de l’icône.

Les icônes illustrées PNG ne doivent pas être recolorées automatiquement.

Skins V1 proposés :

| Skin ID | Nom visible | Ambiance |
|---|---|---|
| `neutral` | Neutre | générique, sobre, fallback |
| `red` | Rouge | danger, intensité, blessure, énergie vitale |
| `blue` | Bleu | calme, mana, froid, contrôle |
| `purple` | Violet | magie, mystère, rituel |
| `gold` | Or | valeur, héroïsme, faveur, rareté |
| `green` | Vert | nature, poison, soin, croissance |
| `orange` | Orange | feu, charge, munition, énergie |
| `steel` | Acier | armure, objet, solidité, mécanique |
| `dark` | Sombre | ombre, malédiction, corruption, menace |

Chaque skin peut définir :

- `accent`
- `accentSoft`
- `accentStrong`
- `surface`
- `surfaceSoft`
- `border`
- `barFill`
- `barEmpty`
- `text`
- `textMuted`
- `glow`

Fallback skin : `neutral`.

## 13. Aperçu live V1

L’aperçu live doit montrer le rendu du tracker pendant la création ou l’édition.

Il doit refléter :

- `name`
- `visualType`
- valeurs (`current`, `max`, `value`)
- `iconId`
- `skinId`

Règle technique recommandée :

```txt
StatPreview
  reçoit l’état temporaire du formulaire
  crée un previewTracker non sauvegardé
  applique les fallbacks techniques
  appelle le même StatTrackerRenderer que les trackers réels
```

En V1, l’aperçu concerne uniquement le rendu panel, pas le rendu token.

L’aperçu ne doit jamais corriger automatiquement les choix du MJ.

## 14. Structure technique recommandée

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

Si des composants équivalents existent déjà, il faut les adapter plutôt que recréer une architecture parallèle.

## 15. Presets

Les presets sont des raccourcis de création. Ils peuvent proposer un nom, un visual type, une icône, un skin et des valeurs, mais tout doit rester modifiable après application.

Exemples de presets possibles :

| Preset | Icône proposée | Type proposé | Skin proposé |
|---|---|---|---|
| PV | `body_heart` | `bar` | `red` |
| CA | `body_shield` | `readonly` | `steel` |
| Munitions | `arcane_projectile` | `counter` | `orange` |
| Sort | `arcane_rune` | `units` ou `counter` | `purple` |
| Point héroïsme | `arcane_star` | `units` | `gold` |
| Charges | `arcane_crystal` | `counter` ou `units` | `purple` ou `orange` |
| Compteur | `object_circle` | `counter` | `neutral` |

Ce tableau est une aide, pas une règle métier.
