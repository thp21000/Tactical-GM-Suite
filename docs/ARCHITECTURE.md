# Tactical GM Suite — Architecture

> Point de documentation : **5 septembre 2026**.  
> Manifest après remise à niveau documentaire : **0.3.47**.

## 1. But du projet

Tactical GM Suite est une extension Owlbear Rodeo modulaire destinée aux MJ. Elle regroupe des outils tactiques qui doivent pouvoir coopérer sans mélanger leurs responsabilités.

Ordre de développement validé :

1. Core / Dashboard
2. Initiative Tracker
3. Distance / Déplacement / Portée
4. Stat Tracker / Conditions
5. Calendar — reporté
6. Loot Table — reporté

## 2. Principes d’architecture

### 2.1 Séparation par domaine

La logique métier reste dans son feature :

```text
src/features/dashboard/
src/features/initiative/
src/features/range/
src/features/stats/
src/features/settings/
```

Exemples d’intégrations autorisées :

- Conditions lit Initiative uniquement pour les durées `Rounds` / `Rencontre` ;
- Conditions lit les préférences Core pour langue et système ;
- Stats lit l’assignation joueur Core pour ses permissions ;
- Conditions et Trackers partagent le profil embarqué mais pas leur moteur d’overlay.

### 2.2 Core transversal

`src/core/` contient uniquement les fondations réellement communes :

- constantes ;
- registre de modules ;
- wrappers Owlbear ;
- thème ;
- préférences globales ;
- assignation token → joueur ;
- stockage transversal nécessaire.

L’assignation joueur est maintenant une donnée Core, pas une propriété métier du Stat Tracker.

Référence : `docs/TOKEN_PLAYER_ASSIGNMENT.md`.

### 2.3 Shared réellement générique

`src/shared/` contient seulement les composants et styles réutilisables par plusieurs modules.

Les composants propres à Stats/Conditions restent dans `src/features/stats/`.

### 2.4 Robustesse Owlbear

Toute intégration Owlbear doit :

- attendre la disponibilité du SDK ;
- supporter les changements de scène ;
- nettoyer abonnements et menus ;
- ne pas inventer d’API SDK ;
- limiter les écritures ;
- utiliser des métadonnées versionnées et lues prudemment ;
- séparer les cycles de synchronisation de domaines différents.

## 3. Stack et pipeline

Stack : React, TypeScript, Vite, `@owlbear-rodeo/sdk`, `lucide-react`, CSS local.

Validation :

```bash
npm run typecheck
npm run build
```

Déploiement : `.github/workflows/deploy-pages.yml`.

## 4. Entrypoints runtime

### Popover principal

`src/main.tsx` charge `<App />` dans le cas normal.

Le popover mesure 560 × 720 px.

`App.tsx` reste un shell : navigation et routage léger, sans logique métier de module.

### Background permanent

Le manifest déclare `background.html` comme background.

Le background porte les fonctions qui doivent rester actives même si le popover principal n’est jamais ouvert :

- menus contextuels ;
- assignation joueur ;
- ajout/retrait Stat Tracker ;
- préchargement PNG ;
- synchronisation Conditions ;
- synchronisation des durées Conditions avec Initiative ;
- reconstruction/synchronisation des Stat Docks ;
- résumé de permissions nécessaire aux Context Menus.

Le préchargement des assets est lancé dès `OBR.onReady`, Conditions en priorité puis Trackers.

### Vues contextuelles embarquées

`src/main.tsx` route les vues embarquées utilisées par les sous-menus Owlbear, notamment :

```text
?view=stats-conditions
?view=stats-trackers
```

Le sous-menu `Tactical GM Suite` utilise lui aussi une vue/context embed pour avoir un comportement au survol cohérent avec Stats et Conditions.

## 5. Préférences globales

Fichiers clés :

```text
src/core/storage/preferences.ts
src/core/preferences/AppPreferencesProvider.tsx
src/i18n/index.tsx
```

Préférences :

```text
language   = fr | en
gameSystem = DND5E | PF2E | GENERIC
```

Toute nouvelle chaîne ou chaîne modifiée doit être fournie simultanément en FR et EN.

## 6. Arborescence utile

```text
src/
  App.tsx
  main.tsx
  background.ts

  core/
    constants/
    modules/
    obr/
    preferences/
    storage/
    theme/
    tokens/

  i18n/

  features/
    dashboard/
    initiative/
    range/
    stats/
    settings/
    debug/
    modules/

  shared/
    components/
    styles/

public/
  manifest.json
  assets/stats/

docs/
  ARCHITECTURE.md
  LOCALIZATION_AND_SYSTEMS.md
  TOKEN_PLAYER_ASSIGNMENT.md
  features/STATS_V2_SPEC.md
  stats/
```

## 7. Initiative Tracker

Responsabilités : participants, ordre, rounds, tours, actifs/inactifs, vaincus, import Owlbear et stockage adapté à la room.

Conditions peut uniquement consulter Initiative pour :

- disponibilité des durées `Rounds` / `Rencontre` ;
- progression des rounds ;
- fin de rencontre.

Cela ne transforme pas Initiative en moteur de règles D&D/PF2e.

## 8. Distance / Déplacement / Portée

Responsabilités : lecture des items Owlbear, origine/cibles, mesures tactiques, grille, presets et préférences.

Aucune dépendance Stats/Range automatique n’est active.

## 9. Stat Tracker — modèle et persistance

Structure conceptuelle :

```text
StatTrackerState
  ├─ tokens[]
  │   ├─ trackers[]
  │   └─ conditions[]
  ├─ groups[]
  └─ presets
```

Les trackers n’ont aucune sémantique obligatoire. Le sens utilisateur, le renderer, l’icône et la valeur sont indépendants.

Le profil durable est embarqué dans les métadonnées du token Owlbear.

Conséquences :

- retirer du Stat Tracker peut conserver le profil ;
- réajouter restaure la configuration ;
- copier un token peut transporter le profil ;
- plusieurs instances peuvent représenter un même profil canonique ;
- Conditions peut exister sur un profil dormant `isTracked = false`.

## 10. Assignation joueur

Source de vérité :

```text
src/core/tokens/tokenPlayerAssignment.ts
```

L’assignation n’exige pas que le token soit suivi par Stats.

Stats conserve encore un miroir d’assignation pour compatibilité avec ses permissions actuelles, mais ce miroir ne doit pas devenir une seconde source de vérité.

## 11. Menus contextuels

Tokens compatibles : `IMAGE` sur `CHARACTER`, `MOUNT`, `PROP`.

### Tactical GM Suite

Sous-menu rapide :

```text
Ajouter/Retirer du Stat Tracker
Lié à personne / Lié à <joueur>
```

Il doit s’ouvrir au survol et rester stable : aucun polling ou resync visuel continu ne doit provoquer de clignotement.

### Stats

Interface de changement rapide :

- MJ : trackers applicables ;
- joueur : uniquement token assigné + tracker `canPlayerEdit` ;
- aucune action d’administration Modifier/Supprimer/Afficher sur token.

### Conditions

L’accès joueur est contrôlé par le réglage room `allowPlayerConditions`, désactivé par défaut.

## 12. Réglages Stats de room

Service :

```text
src/features/stats/services/statRoomSettings.ts
```

Version : `STAT_ROOM_SETTINGS_VERSION = 2`.

```ts
{
  allowPlayerConditions: boolean,
  tokenStatsPosition: "top" | "bottom"
}
```

Le MJ seul peut modifier ces réglages.

## 13. Conditions — catalogue et dérivations

Catalogue runtime : `services/statConditionCatalog.ts`.

```text
DND5E   -> 15
PF2E    -> 42
GENERIC -> 0
```

Le runtime n’utilise plus l’ancien catalogue ni ses aliases de migration.

Le moteur de dérivation distingue :

```text
while-active
on-apply
```

Les relations circonstancielles restent manuelles.

Référence : `docs/stats/CONDITION_DERIVATIONS.md`.

## 14. Frontière stricte entre overlays

```text
Stats      -> token.trackers   -> Stat Dock
Conditions -> token.conditions -> badges Conditions
```

Ils ont :

- services de sync distincts ;
- métadonnées distinctes ;
- triggers distincts ;
- géométries distinctes.

Une modification Conditions ne doit jamais faire réapparaître le Stat Dock.

## 15. Overlay Conditions

Services principaux :

```text
services/statConditionOverlayObrSync.ts
services/statConditionOverlayAutoSync.ts
```

Géométrie de référence :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Formule :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Aucun niveau n’est écrit sur le badge.

## 16. Stat Dock — modèle visuel

Le Stat Dock regroupe tous les trackers `showOnToken` dans une seule zone au-dessus ou au-dessous du token.

Aucun contrôle interactif n’est rendu sur la scène.

Mapping :

```text
readonly/counter -> valeur simple
toggle           -> icône + nom, actif/inactif visuel
bar              -> icône + nom + current/max + barre
icon             -> unités répétées actives/inactives
```

La position room est `tokenStatsPosition`.

Le layout limite actuellement le nombre de trackers visibles et peut produire un `+N` pour l’overflow.

## 17. Stat Dock — pipeline runtime

Entrée publique :

```text
services/statTokenOverlayObrSync.ts
```

Au checkpoint, elle réexporte :

```text
statTokenOverlayObrSyncV17
```

V17.1 repose sur la création géométrique V12.

### Leçon Owlbear importante

Les tests en room ont montré que les objets `Text` de scène peuvent disparaître lorsqu’on modifie leur layer ou leur zIndex après création.

Règle actuelle :

- ne jamais muter les `Text` après `addItems` ;
- laisser leur layer/zIndex natif ;
- placer uniquement les objets graphiques derrière eux.

Ordre graphique actuel :

```text
Text natif       0, non muté
mute shape      -5
icône PNG       -10
shape/barre     -20
plaque SVG      -30
```

Tout reste sur `ATTACHMENT`.

### Pourquoi pas Label ?

`Label` s’est révélé visible mais en screen-space : sa taille ne suit pas correctement le zoom par rapport au token.

Le Stat Dock doit suivre l’espace scène comme les Conditions. Le renderer privilégie donc `Text` de scène malgré les contraintes d’empilement.

### État de validation

La géométrie des plaques et des icônes est proche de la direction voulue. La combinaison finale `Text visible + zoom stable + empilement correct` doit encore être revalidée en room après V17.1.

Ne pas considérer ce renderer comme final tant que ce test n’est pas passé.

## 18. Assets Stats overlay

```text
public/assets/stats/stat-plate.svg
public/assets/stats/stat-plate-muted.svg
public/assets/stats/stat-unit.svg
public/assets/stats/stat-unit-muted.svg
```

Les icônes restent les PNG du registre Stats.

## 19. Audiences et permissions

Toujours distinguer :

```text
canPlayerEdit
visibility
showOnToken
```

`visibility` pilote l’audience de scène, `canPlayerEdit` l’édition, `showOnToken` l’intention d’affichage.

Les audiences `public/private/gm` restent gérées par les APIs Owlbear prévues (`scene.items` / `scene.local`).

## 20. Documentation de référence

- `PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/LOCALIZATION_AND_SYSTEMS.md`
- `docs/TOKEN_PLAYER_ASSIGNMENT.md`
- `docs/features/STATS_V2_SPEC.md`
- `docs/stats/README.md`
- `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`
- `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`
- `docs/stats/CONDITIONS_RUNTIME_SYNC.md`
- `docs/stats/CONDITION_DERIVATIONS.md`

Le code courant reste la référence finale pour l’implémentation réelle.
