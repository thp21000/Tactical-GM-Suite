# Stats module — carte du code et état d’implémentation

> Mise à jour : **4 septembre 2026**.

Le module Stats gère des trackers personnalisables et le sous-système Conditions attachés aux tokens Owlbear Rodeo.

Il ne doit pas être traité comme une fiche de personnage complète.

## Source de vérité

Avant toute modification fonctionnelle importante, lire :

```text
docs/features/STATS_V2_SPEC.md
PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/LOCALIZATION_AND_SYSTEMS.md
docs/stats/README.md
docs/stats/CONDITIONS_RUNTIME_SYNC.md
```

Pour le contenu canonique Conditions :

```text
docs/stats/CONDITIONS_MASTER_CATALOG_V1.md
```

## Principes obligatoires

- le sens d’un tracker est défini par le MJ ;
- une icône ne définit jamais une stat ;
- les presets sont des raccourcis modifiables ;
- `skinId` est legacy ;
- Conditions et Stat Tracker restent fonctionnellement indépendants ;
- les profils durables sont embarqués dans les métadonnées Owlbear ;
- les actions rapides ne doivent pas dupliquer toute l’administration Stats ;
- les permissions d’édition joueur sont séparées de la visibilité d’overlay ;
- langue et système viennent des préférences globales du Core ;
- toute nouvelle chaîne utilisateur doit être fournie en FR et EN ;
- une action Conditions ne doit jamais réveiller l’overlay Stats ;
- plusieurs conditions doivent pouvoir rester actives simultanément.

## Structure du module

```text
src/features/stats/
  StatDashboardOverview.tsx
  StatTrackerPage.tsx
  statTypes.ts
  statConstants.ts

  assets/
    icons/
    condition/
      Icon/

  background/
    setupStatBackground.ts

  components/
    StatTrackedTokenBlock.tsx
    StatTrackerCard.tsx
    StatTrackerForm.tsx
    StatTrackerValueControls.tsx
    StatTokenForm.tsx
    ...

  context/
    StatConditionContextMenuApp.tsx
    StatTrackerContextMenuApp.tsx
    ...

  hooks/
    useStatPermissionViewer.ts
    useStatSceneTokenBindings.ts
    useStatTokenOverlayAutoSync.ts
    useStatTrackerState.ts
    ...

  i18n/
    fr.ts
    en.ts
    conditions.fr.ts
    conditions.en.ts

  services/
    statAssetPreload.ts
    statPermissions.ts
    statPresets.ts
    statTrackers.ts
    statTrackerIcons.ts
    statTokenSceneLinks.ts
    statEmbeddedProfileActions.ts
    statContextMenuActions.ts
    statTokenEligibility.ts
    statConditionCatalog.ts
    statConditionAssets.ts
    statConditionContextActions.ts
    statConditionInitiativeSync.ts
    statConditionOverlayAutoSync.ts
    statConditionOverlayObrSync.ts
    statTokenOverlayObrSync.ts
    ...
```

L’ancien service `statConditions.ts` n’existe plus dans le runtime courant.

## Entrypoints et surfaces UI

Stats existe sur trois surfaces distinctes.

### 1. Page Stats principale

`StatTrackerPage.tsx`

Responsabilités :

- afficher les groupes/tokens de la scène ;
- hydrater les instances liées ;
- appliquer le filtrage du viewer ;
- lancer la synchronisation automatique des overlays trackers côté MJ ;
- donner accès aux formulaires/presets côté MJ.

La page Stats n’administre plus le moteur Conditions.

### 2. Sous-menu Conditions

`context/StatConditionContextMenuApp.tsx`

Chargé par :

```text
?view=stats-conditions
```

Fonctions actuelles :

- système global D&D5e/PF2e/Générique ;
- langue globale FR/EN ;
- recherche ;
- tri alphabétique selon le label traduit ;
- activation/désactivation ;
- édition ciblée d’une condition active ;
- niveau/valeur selon définition ;
- durée ;
- visibilité ;
- hover Description + Résumé règles ;
- plusieurs conditions actives simultanément.

Le hover est positionné à partir de la ligne réellement survolée et se place au-dessus lorsque possible.

### 3. Sous-menu Stats rapide

`context/StatTrackerContextMenuApp.tsx`

Chargé par :

```text
?view=stats-trackers
```

Il réutilise `StatTrackerCard` dans une largeur adaptée au Context Menu.

Le MJ peut y manipuler tous les trackers du token. Le joueur assigné ne voit que ceux avec `canPlayerEdit = true`.

Les menus d’administration `…` restent masqués.

## Background permanent

`background/setupStatBackground.ts` est chargé depuis le background Owlbear déclaré dans le manifest.

Il doit fonctionner même si le popover principal n’est pas ouvert.

Il enregistre :

- Ajouter au Stat Tracker ;
- Retirer du Stat Tracker ;
- Stats ;
- Conditions.

Il maintient aussi :

- préchargement des PNG Conditions puis Trackers ;
- badges Conditions et leur auto-sync de géométrie ;
- résumé `playerEditable` / `assignedPlayerId` ;
- synchronisation de durée Conditions ↔ Initiative.

## Préchargement assets

`services/statAssetPreload.ts`

Le préchargement démarre au `OBR.onReady` du background.

Ordre :

```text
Conditions canoniques
puis icônes Stats
```

Concurrence limitée à 4 chargements.

But : réutiliser le cache navigateur lorsque l’utilisateur ouvre ensuite le sous-menu ou crée un overlay.

## Éligibilité des tokens

`services/statTokenEligibility.ts`

Runtime strict :

```text
item.type === IMAGE
layer in CHARACTER | MOUNT | PROP
```

## Modèle de données

`statTypes.ts`

### Types de token

```text
pc
npc
enemy
mount
object
trap
familiar
other
```

### Types visuels trackers

```text
icon
bar
counter
readonly
toggle
```

Ne pas ajouter un sixième type sans chantier explicite.

## Trackers

### `bar`

- `current/max` ;
- drag horizontal ;
- édition inline math ;
- bulles pseudo-aléatoires ;
- désaturation progressive ;
- couleur d’accent de l’icône.

### `counter`

- pastille centrale 48 px ;
- `-5`, `-1`, `+1`, `+5` ;
- pas de borne ;
- pas de drag ;
- inline math.

### `readonly`

- nom technique historique ;
- pastille 48 px ;
- pas de rail/boutons ;
- valeur tout de même éditable.

### `toggle`

- pastille 48 px ;
- couleur = actif ;
- désaturé = inactif ;
- clic pour basculer.

### `icon`

- `current` = actifs ;
- `max` = nombre affiché ;
- max courant = 6 ;
- clic cumulatif.

## Calcul inline partagé

```text
12
+3
-2
*2
x2
×2
/2
÷2
```

Le `bar` applique ensuite la borne 0..max.

## Icônes Trackers

`services/statTrackerIcons.ts`

Chargement par glob depuis :

```text
src/features/stats/assets/icons/
```

Catégories :

```text
Corps & Protection -> body
Arcane & Combat -> arcane
Ressources & Richesses -> resource
Objets & Marques -> object
```

Le registre contient labels, accents, aliases legacy et fallback.

L’icône ne doit jamais imposer le sens du tracker.

## Presets

`services/statPresets.ts`

Les presets par type de token :

- proposent des trackers ;
- s’appliquent à l’ajout ;
- peuvent être gérés par le MJ ;
- ne doivent pas écraser arbitrairement les trackers déjà présents.

## Persistance token

### `statTokenSceneLinks.ts`

Clé metadata :

```text
${EXTENSION_ID}/stats-token-link
```

Le normalizer doit rester tolérant aux données utiles plus anciennes.

### `statEmbeddedProfileActions.ts`

Fonctions de lecture/écriture du profil embarqué.

`updateOrCreateEmbeddedConditionToken` permet de conserver des Conditions sans activer le suivi Stats.

## Copies et instances

Le système distingue :

- ID canonique du profil ;
- `sourceItemId` de l’instance Owlbear.

Les services de scène reconstruisent les instances présentes dans la scène courante et évitent les doublons de profil pour les copies.

## Permissions

`services/statPermissions.ts`

### Viewer MJ

Tous les trackers sont modifiables.

### Viewer joueur

```text
canPlayerEdit == true
ET token assigné au viewer
```

La visibilité `gm/private/public` reste une dimension séparée.

## Résumé permission pour Context Menu

Le lien metadata contient :

```text
playerEditable
assignedPlayerId
```

Ce résumé sert au filtrage du menu ; le profil complet reste la source métier pour l’écriture.

## Conditions — catalogue

`services/statConditionCatalog.ts`

```text
DND5E   -> 15 conditions
PF2E    -> 42 conditions
GENERIC -> 0 condition
```

Le runtime n’a plus d’alias vers les anciennes conditions françaises ou hors catalogue canonique.

## Conditions — assets

`services/statConditionAssets.ts`

Les médaillons sont résolus depuis :

```text
assets/condition/Icon/
```

Ils ne dépendent ni de la langue ni de l’icône d’un tracker.

## Conditions — actions

`services/statConditionContextActions.ts`

Invariant : l’upsert d’une condition ne doit modifier que la condition concernée et ne jamais désactiver les autres.

## Durées Initiative

`services/statConditionInitiativeSync.ts`

Utilise les informations de rencontre/round stockées dans la condition pour calculer les durées `Rounds` / `Rencontre`.

Ne pas étendre cette dépendance à d’autres automatismes sans demande explicite.

## Overlay Conditions

`services/statConditionOverlayObrSync.ts`

Paramètres de référence actuels :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Échelle dynamique :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Le rayon utilise la même échelle.

Le niveau n’est pas rendu sur le token. Les anciens rôles `level` ne sont encore lus que pour pouvoir nettoyer d’anciens labels lors d’un sync.

## Auto-sync Conditions

`services/statConditionOverlayAutoSync.ts`

Le background surveille les changements de scale des tokens ayant des Conditions et recalcule la couronne après resize.

Déplacement simple : géré par l’attachement Owlbear.

Resize : resynchronisation géométrique nécessaire.

## Overlay Stats

`hooks/useStatTokenOverlayAutoSync.ts`

Ce hook ne doit écouter que les changements pertinents aux trackers Stats.

Un changement de `token.conditions` ne doit pas créer ou mettre à jour l’overlay Stats.

## UI / CSS

Fichiers importants :

```text
statTrackerUi.css
statMaxValueBar.css
statMaxValueBarLiquid.css
statCounterBar.css
statFixedOrb.css
statIconUnits.css
context/statTrackerContextMenu.css
context/statConditionContextMenu.css
context/statConditionCustomSelect.css
context/statConditionListMeta.css
```

Styles globaux :

```text
src/shared/styles/obrIntegratedUi.css
src/shared/styles/scrollbars.css
```

## Grille compacte

- `bar` : pleine largeur ;
- `counter` : pleine largeur ;
- `icon` : pleine largeur ;
- `readonly` : jusqu’à 3/ligne ;
- `toggle` : jusqu’à 3/ligne.

## Audio

La spec existe dans `docs/stats/STAT_AUDIO_FEEDBACK_V1.md`.

Aucun service audio runtime n’est considéré comme implémenté.

## Points techniques à surveiller

1. propagation immédiate d’un changement joueur vers un overlay visible chez d’autres clients ;
2. garbage collection globale après suppression de la dernière copie d’un token dans toutes les scènes ;
3. cohérence des audiences `public/private/gm` en multi-client ;
4. comportement des badges Conditions sur tailles extrêmes de token ;
5. migration de profils si `STAT_TOKEN_PROFILE_VERSION` évolue ;
6. ordre explicite des nouvelles icônes extras ;
7. dette de nommage `readonly`.

## Validation

Après code :

```bash
npm run typecheck
npm run build
```

Tests terrain recommandés :

- refresh ;
- changement de scène ;
- copie de token ;
- retrait/réajout ;
- joueur assigné ;
- menu sans popover ouvert ;
- conditions sans suivi ;
- plusieurs conditions simultanées ;
- resize 0,5 / 1 / 2 / 3 cases ;
- initiative + rounds ;
- audiences d’overlay ;
- vérifier qu’une action Conditions ne réactive jamais Stats.
