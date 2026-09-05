# Stats module — carte du code et état d’implémentation

> Mise à jour : **5 septembre 2026**.

Le module Stats gère les trackers personnalisables et le sous-système Conditions attachés aux tokens Owlbear Rodeo.

Il ne doit pas être traité comme une fiche de personnage complète.

## Sources de vérité

Avant une modification importante, lire :

```text
PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/features/STATS_V2_SPEC.md
docs/stats/README.md
docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md
docs/stats/CONDITIONS_RUNTIME_SYNC.md
docs/stats/CONDITION_DERIVATIONS.md
docs/TOKEN_PLAYER_ASSIGNMENT.md
```

Catalogue canonique Conditions : `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`.

## Principes obligatoires

- le sens d’un tracker est défini par le MJ ;
- une icône ne définit jamais une stat ;
- `skinId` est legacy ;
- Conditions et Trackers restent fonctionnellement indépendants ;
- les profils durables sont embarqués dans les métadonnées Owlbear ;
- l’assignation token→joueur vient du Core ;
- les permissions d’édition sont séparées de la visibilité ;
- langue et système viennent des préférences globales ;
- toute nouvelle chaîne visible doit exister en FR et EN ;
- une action Conditions ne doit jamais réveiller le Stat Dock ;
- plusieurs conditions doivent pouvoir rester actives simultanément.

## Structure utile

```text
src/features/stats/
  StatTrackerPage.tsx
  statTypes.ts
  statConstants.ts

  assets/
    icons/
    condition/Icon/

  background/
    setupStatBackground.ts

  components/
  context/
  hooks/
  i18n/
  services/
```

Services particulièrement importants :

```text
statRoomSettings.ts
statAssetPreload.ts
statPermissions.ts
statTrackerIcons.ts
statTokenSceneLinks.ts
statEmbeddedProfileActions.ts
statConditionCatalog.ts
statConditionContextActions.ts
statConditionInitiativeSync.ts
statConditionOverlayAutoSync.ts
statConditionOverlayObrSync.ts
statTokenOverlayObrSync.ts
statTokenOverlayObrSyncV12.ts
statTokenOverlayObrSyncV17.ts
```

## Surfaces runtime

### Page Stats principale

`StatTrackerPage.tsx` : groupes/tokens, hydratation, presets, administration MJ et sync Stats.

### Sous-menu Conditions

`?view=stats-conditions`

Recherche, tri alphabétique, activation/désactivation, édition ciblée, durée, visibilité, Description + Résumé règles.

### Sous-menu Stats

`?view=stats-trackers`

Modification rapide uniquement. Les actions d’administration restent dans la page principale.

### Sous-menu Tactical GM Suite

L’assignation token→joueur est gérée par le Core et reste disponible indépendamment du suivi Stats.

## Background permanent

`background/setupStatBackground.ts` doit fonctionner sans ouverture du popover principal.

Il gère notamment :

- menus contextuels ;
- préchargement PNG ;
- auto-sync Conditions ;
- resync du Stat Dock ;
- synchronisation durées Conditions ↔ Initiative ;
- résumé des permissions Context Menu.

## Réglages de room

`services/statRoomSettings.ts`

```text
version = 2
allowPlayerConditions = false par défaut
tokenStatsPosition = top par défaut
```

Le MJ seul modifie ces réglages.

## Types visuels trackers

```text
bar
counter
readonly
toggle
icon
```

Ne pas ajouter de sixième type sans chantier explicite.

## Permissions

Pour un joueur :

```text
token assigné au viewer
ET
canPlayerEdit == true
```

Toujours distinguer :

```text
canPlayerEdit
visibility
showOnToken
```

## Assignation joueur

Source Core :

```text
src/core/tokens/tokenPlayerAssignment.ts
```

Le profil Stats garde un miroir temporaire, mais ce miroir n’est pas la source de vérité.

## Conditions

Catalogue :

```text
DND5E   -> 15
PF2E    -> 42
GENERIC -> 0
```

L’ancien `statConditions.ts` n’est plus utilisé.

Les conditions dérivées distinguent `while-active` et `on-apply`.

## Overlay Conditions

Services :

```text
statConditionOverlayObrSync.ts
statConditionOverlayAutoSync.ts
```

Géométrie actuelle :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Resize :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

## Stat Dock

Entrée publique :

```text
services/statTokenOverlayObrSync.ts
```

Renderer actif :

```text
statTokenOverlayObrSyncV17
```

État : **V17.1**.

### Principe de rendu

Le Stat Dock regroupe les trackers `showOnToken` dans une zone unique top/bottom.

Mapping :

```text
readonly/counter -> valeur simple
toggle           -> icône + nom
bar              -> nom + current/max + barre
icon             -> unités répétées
```

### Règle Owlbear critique

Ne pas muter les objets `Text` de scène après leur création.

Les tests ont montré que modifier leur layer ou leur zIndex après `addItems` peut les faire disparaître.

V17.1 conserve donc les `Text` créés par V12 tels quels et recule uniquement les objets graphiques :

```text
Text natif       0
mute shape      -5
icône PNG       -10
shape/barre     -20
plaque SVG      -30
```

Tout reste sur `ATTACHMENT`.

Ne pas revenir à un renderer global basé sur `Label` pour résoudre l’empilement : `Label` a déjà montré un mauvais comportement de proportion au zoom.

### Validation encore requise

Le Stat Dock n’est pas final tant que ces points ne sont pas validés en room :

- texte visible ;
- zoom stable ;
- texte dans les plaques ;
- barres correctement contenues ;
- tailles 0,5 / 1 / 2 / 3 cases ;
- top/bottom ;
- public/private/gm ;
- overflow `+N`.

## Validation après code

```bash
npm run typecheck
npm run build
```

Tests terrain recommandés : refresh, changement de scène, copie, retrait/réajout, joueur assigné, menu sans popover, conditions sans suivi, plusieurs conditions, resize, Initiative/Rounds, audiences et indépendance Stats/Conditions.
