# Tactical GM Suite — Localisation et systèmes de jeu

> Fondation introduite le 3 septembre 2026. Mise à jour : **4 septembre 2026**.

## Objectif

Tactical GM Suite possède deux préférences globales indépendantes :

- la langue de l’interface ;
- le système de jeu actif.

Ces préférences appartiennent au Core. Un module peut les consommer lorsqu’elles ont un sens pour lui, sans obliger les autres modules à devenir dépendants d’un système de règles.

Le but est d’éviter de recréer plus tard un sélecteur propre à Conditions, Loot Table, Initiative ou tout autre module dépendant d’un système.

## Langues supportées

Identifiants stables :

```text
fr
en
```

Valeurs UI :

```text
fr -> Français
en -> English
```

Le sélecteur affiche le drapeau correspondant à la langue. La préférence est persistée localement et partagée entre les surfaces React de Tactical GM Suite.

La migration de l’interface historique n’est pas faite en bloc. Les écrans existants peuvent donc encore contenir du français tant qu’un chantier de traduction ne les a pas repris.

### Règle à partir de cette fondation

Toute nouvelle chaîne visible par l’utilisateur, ou toute chaîne existante modifiée dans un nouveau chantier, doit être ajoutée simultanément en français et en anglais.

Les traductions restent proches du module qui les utilise :

```text
src/features/<module>/i18n/fr.ts
src/features/<module>/i18n/en.ts
```

Le registre central est :

```text
src/i18n/index.tsx
```

Des fichiers sont déjà préparés pour Dashboard, Initiative, Range, Modules, Settings, Stats et Debug.

## Systèmes supportés

Identifiants stables :

```text
DND5E
PF2E
GENERIC
```

Le choix est global mais son utilisation est opt-in par module.

Dans Paramètres, le système actif possède un indicateur visuel explicite ; il ne faut pas dépendre uniquement d’une variation de couleur pour savoir lequel est sélectionné.

### D&D 5e

La base Conditions cible D&D 5e 2014 / SRD 5.1, conformément à `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`.

### Pathfinder 2e

La base Conditions cible Pathfinder 2e Remaster / Player Core, conformément au même catalogue maître.

### Générique

Le système `GENERIC` est un vrai identifiant de préférence. Son catalogue Conditions est volontairement vide pour le moment, mais l’entrée doit rester disponible dans Paramètres et dans les contrats de données.

## Préférences par défaut

```text
language   = fr
gameSystem = PF2E
```

## Stockage et partage entre surfaces Owlbear

La source locale est `src/core/storage/preferences.ts` et le provider React global est `src/core/preferences/AppPreferencesProvider.tsx`.

Le provider enveloppe le popover principal ainsi que les vues embarquées des Context Menus.

Les différentes iframes Owlbear utilisent la même clé de stockage et écoutent l’événement `storage` afin qu’un changement de langue ou de système se propage sans créer des préférences concurrentes.

## Conditions

Le catalogue runtime dépendant du système est :

```text
src/features/stats/services/statConditionCatalog.ts
```

Il expose actuellement :

```text
DND5E   -> 15 conditions
PF2E    -> 42 conditions
GENERIC -> 0 condition
```

Les 11 concepts partagés D&D5e/PF2e gardent un ID canonique commun, mais leur modèle de valeur et leur résumé de règles restent spécifiques au système.

Les descriptions et résumés de règles localisés sont placés dans :

```text
src/features/stats/i18n/conditions.fr.ts
src/features/stats/i18n/conditions.en.ts
```

### Liste et hover

La liste Conditions est triée alphabétiquement à partir du libellé traduit. Le tri suit donc automatiquement la langue active.

Au survol d’une condition, la carte d’information s’ancre directement au-dessus de la ligne survolée lorsque l’espace disponible le permet. Elle affiche :

- **Description** ;
- **Résumé règles** du système actuellement sélectionné.

Le hover ne doit pas afficher le résumé d’un autre système pour une entrée partagée.

### Assets

Les assets Conditions sont indépendants de la langue et utilisent les IDs canoniques :

```text
src/features/stats/assets/condition/Icon/
```

Ils sont préchargés par le background Owlbear avant les icônes Stats afin d’accélérer l’ouverture des sous-menus et le premier rendu des badges.

### Modèle canonique uniquement

Le runtime ne contient plus de catalogue de conditions historique ni d’alias de migration. Le stockage accepte uniquement les IDs canoniques présents dans le catalogue runtime.

Cette décision est volontaire : l’addon n’est pas encore distribué à des utilisateurs externes nécessitant une migration des anciennes sauvegardes.

Chaque condition active est indépendante : ajouter ou modifier une condition ne désactive jamais les autres conditions du token.

## Affichage Conditions / Stats

Conditions et Stats possèdent deux systèmes d’affichage séparés :

- Stats produit uniquement les overlays issus de `token.trackers` ;
- Conditions produit uniquement les badges issus de `token.conditions` ;
- chaque système possède sa propre clé de métadonnées Owlbear ;
- chaque système possède son propre service de synchronisation ;
- une modification de condition ne doit jamais provoquer la réapparition de l’overlay Stats.

Le détail de la synchronisation Conditions est documenté dans :

```text
docs/stats/CONDITIONS_RUNTIME_SYNC.md
```

## Futur Loot Table

Quand Loot Table sera intégré à Tactical GM Suite, il devra consommer `gameSystem` et `language` depuis le Core au lieu de créer son propre sélecteur global.

Le contenu Loot pourra ensuite varier par système, comme le fait déjà Conditions.

## Non-objectifs actuels

Ce socle ne signifie pas :

- traduction immédiate de tout l’addon existant ;
- ajout de contenu Conditions générique ;
- intégration de Loot Table ;
- ajout de D&D 2024 ;
- automatisation mécanique complète des effets de conditions.
