# Tactical GM Suite — Localisation et systèmes de jeu

> Fondation introduite le 3 septembre 2026.

## Objectif

Tactical GM Suite possède deux préférences globales indépendantes :

- la langue de l'interface ;
- le système de jeu actif.

Ces préférences appartiennent au Core. Un module peut les consommer lorsqu'elles ont un sens pour lui, sans obliger les autres modules à devenir dépendants d'un système de règles.

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

Le sélecteur affiche également le drapeau correspondant. La langue est persistée dans les préférences locales de Tactical GM Suite.

La migration de l'interface historique n'est pas faite en bloc. Les écrans existants peuvent donc encore contenir du français tant qu'un chantier de traduction ne les a pas repris.

### Règle à partir de cette fondation

Toute nouvelle chaîne visible par l'utilisateur, ou toute chaîne existante modifiée dans un nouveau chantier, doit être ajoutée simultanément en français et en anglais.

Les traductions restent proches du module qui les utilise :

```text
src/features/<module>/i18n/fr.ts
src/features/<module>/i18n/en.ts
```

Le registre central est :

```text
src/i18n/index.tsx
```

Les fichiers déjà préparés couvrent Dashboard, Initiative, Range, Modules, Settings, Stats et Debug.

## Systèmes supportés

Identifiants stables :

```text
DND5E
PF2E
GENERIC
```

Le choix est global mais son utilisation est opt-in par module. Le système actuellement actif possède un indicateur visuel explicite dans Paramètres.

### D&D 5e

La base Conditions cible D&D 5e 2014 / SRD 5.1, conformément à `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`.

### Pathfinder 2e

La base Conditions cible Pathfinder 2e Remaster / Player Core, conformément au même catalogue maître.

### Générique

Le système `GENERIC` est un vrai identifiant de préférence. Son catalogue Conditions est volontairement vide pour le moment.

## Préférence par défaut

```text
language   = fr
gameSystem = PF2E
```

## Stockage et partage entre surfaces Owlbear

La source locale est `src/core/storage/preferences.ts` et le provider React global est `src/core/preferences/AppPreferencesProvider.tsx`.

Il enveloppe le popover principal, le sous-menu Conditions et le sous-menu Stats rapide. Les différentes iframes Owlbear utilisent la même clé de stockage et écoutent l'événement `storage`.

## Conditions

Le catalogue runtime dépendant du système est :

```text
src/features/stats/services/statConditionCatalog.ts
```

Il expose :

```text
DND5E   -> 15 conditions
PF2E    -> 42 conditions
GENERIC -> 0 condition actuellement
```

Les 11 concepts partagés D&D5e/PF2e gardent un ID canonique commun, mais leur modèle de valeur et leur résumé de règles restent spécifiques au système.

Les descriptions et résumés de règles localisés sont placés dans :

```text
src/features/stats/i18n/conditions.fr.ts
src/features/stats/i18n/conditions.en.ts
```

Le menu Conditions affiche ces informations au survol selon la langue et le système actuellement sélectionnés.

Les assets sont indépendants de la langue et utilisent les IDs canoniques :

```text
src/features/stats/assets/condition/Icon/
```

### Modèle canonique uniquement

Le runtime ne contient plus de catalogue de conditions historique ni d'alias de migration. Le stockage accepte uniquement les IDs canoniques présents dans `statConditionCatalog.ts`.

Chaque condition active est indépendante : ajouter ou modifier une condition ne désactive jamais les autres conditions du token.

### Affichage sur token

Conditions et Stats possèdent deux systèmes d'affichage séparés :

- Stats produit uniquement les overlays issus de `token.trackers` ;
- Conditions produit uniquement les badges issus de `token.conditions` ;
- chaque système possède sa propre clé de métadonnées Owlbear et son propre service de synchronisation.

Les badges Conditions sont petits et centrés sur la couronne du token. Le premier anneau suit directement le bord du token et un second anneau n'est créé que si le nombre de conditions dépasse la capacité du premier.

## Futur Loot Table

Quand Loot Table sera intégré à Tactical GM Suite, il devra consommer `gameSystem` depuis le Core au lieu de créer son propre sélecteur global.

## Non-objectifs actuels

Ce socle ne signifie pas :

- traduction immédiate de tout l'addon existant ;
- ajout de contenu Conditions générique ;
- intégration de Loot Table ;
- ajout de D&D 2024 ;
- automatisation mécanique complète des effets de conditions.
