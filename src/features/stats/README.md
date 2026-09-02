# Stats module — carte du code et état d’implémentation

> Mise à jour : 2 septembre 2026.

Le module Stats gère des trackers personnalisables et des conditions attachés aux tokens Owlbear Rodeo.

Il ne doit pas être traité comme une fiche de personnage complète.

## Source de vérité

Avant toute modification fonctionnelle importante, lire :

```text
docs/features/STATS_V2_SPEC.md
```

Pour le contexte global :

```text
PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/stats/README.md
```

## Principes obligatoires

- le sens d’un tracker est défini par le MJ ;
- une icône ne définit jamais une stat ;
- les presets sont des raccourcis modifiables ;
- `skinId` est legacy ;
- Conditions et Stat Tracker restent indépendants ;
- les profils durables sont embarqués dans les métadonnées Owlbear ;
- les actions rapides ne doivent pas dupliquer toute l’administration Stats ;
- les permissions d’édition joueur sont séparées de la visibilité d’overlay.

## Structure du module

```text
src/features/stats/
  StatDashboardOverview.tsx
  StatTrackerPage.tsx
  statTypes.ts
  statConstants.ts

  assets/
    icons/
    conditions/
    ...

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

  services/
    statPermissions.ts
    statPresets.ts
    statTrackers.ts
    statTrackerIcons.ts
    statTokenSceneLinks.ts
    statEmbeddedProfileActions.ts
    statContextMenuActions.ts
    statTokenEligibility.ts
    statConditionInitiativeSync.ts
    statConditionOverlayObrSync.ts
    statTokenOverlayObrSync.ts
    ...
```

## Entrypoints et surfaces UI

Stats existe sur trois surfaces distinctes.

### 1. Page Stats principale

`StatTrackerPage.tsx`

Responsabilités :

- afficher les groupes/tokens de la scène ;
- hydrater les instances liées ;
- appliquer le filtrage du viewer ;
- lancer la synchronisation automatique des overlays côté MJ ;
- donner accès aux formulaires/presets côté MJ.

### 2. Sous-menu Conditions

`context/StatConditionContextMenuApp.tsx`

Chargé par :

```text
?view=stats-conditions
```

Il fonctionne depuis le Context Menu Owlbear enregistré par le background.

### 3. Sous-menu Stats rapide

`context/StatTrackerContextMenuApp.tsx`

Chargé par :

```text
?view=stats-trackers
```

Il réutilise `StatTrackerCard` pour garder le même langage visuel, mais passe `isGm={false}` volontairement afin de masquer les menus d’administration `…`.

Le MJ peut y manipuler tous les trackers du token. Le joueur assigné ne voit que ceux avec `canPlayerEdit = true`.

## Background permanent

`background/setupStatBackground.ts` est chargé depuis le background Owlbear déclaré dans le manifest.

Il doit fonctionner même si le popover principal n’est pas ouvert.

Il enregistre :

- Ajouter au Stat Tracker ;
- Retirer du Stat Tracker ;
- Stats ;
- Conditions.

Il maintient aussi :

- badges/overlays de conditions au changement de scène ;
- résumé `playerEditable` / `assignedPlayerId` pour filtrer le menu Stats côté joueur ;
- synchronisation de durée Conditions ↔ Initiative.

## Éligibilité des tokens

`services/statTokenEligibility.ts`

Runtime strict :

```text
item.type === IMAGE
layer in CHARACTER | MOUNT | PROP
```

Les filtres de Context Menu excluent explicitement les autres couches Owlbear.

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

### Types visuels

```text
icon
bar
counter
readonly
toggle
```

Ne pas ajouter un sixième type sans chantier explicite : le comportement « unités » a été intégré au type historique `icon`.

## Trackers

### `bar`

Barre à valeur max :

- `current/max` ;
- drag horizontal ;
- édition inline math ;
- bulles pseudo-aléatoires ;
- désaturation progressive de l’icône ;
- couleur d’accent de l’icône.

### `counter`

Indicateur modifiable :

- pastille centrale 48 px ;
- `-5`, `-1`, `+1`, `+5` ;
- pas de borne ;
- pas de drag ;
- inline math.

### `readonly`

Indicateur fixe :

- nom technique historique ;
- pastille 48 px ;
- pas de rail ;
- pas de boutons ;
- valeur tout de même éditable par clic/inline math.

### `toggle`

- pastille 48 px ;
- couleur = actif ;
- désaturé = inactif ;
- clic pour basculer.

### `icon`

Indicateur à icônes cumulatives :

- `current` = actifs ;
- `max` = nombre affiché ;
- max courant = 6 ;
- clic cumulatif.

## Calcul inline partagé

Le renderer accepte :

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

`counter` et `readonly` ne possèdent pas de borne min/max métier.

## Icônes

`services/statTrackerIcons.ts`

Chargement :

```ts
import.meta.glob("../assets/icons/**/*.png", ...)
```

Catégories reconnues par dossier :

```text
Corps & Protection -> body
Arcane & Combat -> arcane
Ressources & Richesses -> resource
Objets & Marques -> object
```

Le registre contient :

- labels explicites ;
- accents explicites ;
- aliases legacy ;
- fallback.

Base documentée : 48 icônes + 15 ajouts.

L’ordre explicite `ICON_ORDER` couvre actuellement la base 48 ; les extras sans position explicite retombent après elle selon le tri secondaire. Ne pas supposer que tous les nouveaux assets ont une position manuelle.

## Presets

`services/statPresets.ts`

Les presets par type de token :

- proposent des trackers ;
- s’appliquent à l’ajout ;
- peuvent être gérés par le MJ ;
- ne doivent pas écraser les trackers déjà présents ;
- ne doivent pas transformer le label/icône en règle métier.

## Persistance token

### `statTokenSceneLinks.ts`

Clé metadata :

```text
${EXTENSION_ID}/stats-token-link
```

Profil versionné :

```text
version = 1
```

Le normalizer doit rester tolérant aux anciennes données.

Le serializer retire `skinId`.

### `statEmbeddedProfileActions.ts`

Fonctions de lecture/écriture du profil embarqué.

Point important : `updateOrCreateEmbeddedConditionToken` permet de conserver des conditions sans activer le suivi Stats.

## Copies et instances

Le système distingue :

- ID canonique du profil ;
- `sourceItemId` de l’instance Owlbear.

Les services de scène reconstruisent les instances présentes dans la scène courante et évitent les doublons de profil pour les copies.

Conserver cette séparation lors de toute évolution.

## Permissions

`services/statPermissions.ts`

### Viewer MJ

Tous les trackers sont modifiables.

### Viewer joueur

Pour les interfaces de contrôle :

```text
canPlayerEdit == true
ET token assigné au viewer
```

La visibilité `gm/private/public` ne bloque plus un tracker explicitement autorisé dans l’interface de contrôle.

Elle reste utilisée pour les audiences d’affichage/overlay et les conditions.

### Filtrage de la page principale

`StatTrackerPage` appelle `filterTokensForViewer` avant de construire les groupes visibles.

Un joueur ne doit pas recevoir les trackers non modifiables dans sa vue Stats.

## Résumé permission pour Context Menu

Les filtres Owlbear ne peuvent pas rechercher `canPlayerEdit` dans un tableau.

Le lien metadata contient donc un résumé :

```text
playerEditable
assignedPlayerId
```

Le background MJ resynchronise ces valeurs.

Ne jamais prendre ce résumé comme source métier principale ; toujours revalider la permission contre le profil au moment de l’écriture.

## Conditions

Les conditions ne sont plus administrées depuis la grande fiche token Stats.

Le flux principal est contextuel.

Fonctions actuelles :

- recherche ;
- activation/désactivation ;
- niveau selon définition ;
- visibilité ;
- durée ;
- affichage autour du token ;
- relation avec Initiative pour rounds/rencontre.

Les effets mécaniques de définition restent descriptifs.

## Durées Initiative

`services/statConditionInitiativeSync.ts`

Utilise les informations de rencontre/round stockées dans la condition pour calculer les durées.

Ne pas étendre cette dépendance à d’autres effets d’initiative sans demande explicite.

## Overlays

La chaîne historique est conservée dans plusieurs services de préparation/rendu.

L’état courant inclut aussi une synchronisation automatique côté MJ via :

```text
hooks/useStatTokenOverlayAutoSync.ts
```

et une synchronisation des conditions depuis le background.

La visibilité doit rester audience-aware.

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
context/statConditionCustomSelect.css
context/statConditionListMeta.css
```

Les styles globaux OBR sont dans :

```text
src/shared/styles/obrIntegratedUi.css
src/shared/styles/scrollbars.css
```

## Grille compacte

Dans la liste principale et l’interface rapide :

- `bar` : pleine largeur ;
- `counter` : pleine largeur ;
- `icon` : pleine largeur ;
- `readonly` : compact, jusqu’à 3/ligne ;
- `toggle` : compact, jusqu’à 3/ligne.

## Actions d’administration

Interface principale MJ : menu `…` sur les trackers.

Interface rapide : aucun `…`.

Ne pas remettre les actions Modifier/Supprimer/ShowOnToken dans le menu rapide sans décision explicite, car son but est la manipulation à la volée.

## Audio

La spec existe dans `docs/stats/STAT_AUDIO_FEEDBACK_V1.md`.

Aucun service audio runtime n’est actuellement identifié. Ne pas brancher de sons opportunistement lors d’une modification visuelle.

## Points techniques à surveiller

1. propagation immédiate d’un changement joueur vers un overlay visible chez d’autres clients ;
2. garbage collection globale après suppression de la dernière copie d’un token dans toutes les scènes ;
3. cohérence des audiences entre trackers et conditions ;
4. migration de profils si `STAT_TOKEN_PROFILE_VERSION` évolue ;
5. ordre explicite des nouvelles icônes extras si la bibliothèque continue de grandir ;
6. dette de nommage `readonly` devenue incohérente avec son comportement actuel.

## Validation

Après code :

```bash
npm run typecheck
npm run build
```

Pour Stats, ajouter des tests terrain Owlbear sur :

- refresh ;
- changement de scène ;
- copie de token ;
- retrait/réajout ;
- joueur assigné ;
- menu sans popover ouvert ;
- conditions sans suivi ;
- initiative + rounds ;
- audiences d’overlay.
