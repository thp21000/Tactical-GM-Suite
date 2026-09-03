# Tactical GM Suite — Localisation et systèmes de jeu

> Fondation introduite le 3 septembre 2026.

## Objectif

Tactical GM Suite possède désormais deux préférences globales indépendantes :

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

La langue est persistée dans les préférences locales de Tactical GM Suite.

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

Les fichiers déjà préparés couvrent :

- Dashboard ;
- Initiative ;
- Range ;
- Modules ;
- Settings ;
- Stats ;
- Debug.

Les dictionnaires vides sont volontaires : ils servent de point d'entrée pour la migration progressive et ne signifient pas que le module est déjà traduit.

## Systèmes supportés

Identifiants stables :

```text
DND5E
PF2E
GENERIC
```

Le choix est global mais son utilisation est opt-in par module.

### D&D 5e

La base Conditions actuelle cible D&D 5e 2014 / SRD 5.1, conformément à `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`.

### Pathfinder 2e

La base Conditions actuelle cible Pathfinder 2e Remaster / Player Core, conformément au même catalogue maître.

### Générique

Le système `GENERIC` est un vrai identifiant de préférence et possède son entrée dans l'interface et dans l'architecture de catalogue.

Son catalogue Conditions est volontairement vide pour le moment. Aucun contenu générique ne doit être inventé implicitement.

## Préférence par défaut

Pour préserver au mieux le comportement de travail actuel pendant la migration du module Conditions :

```text
language   = fr
gameSystem = PF2E
```

Les anciennes préférences qui ne possèdent pas encore `gameSystem` sont normalisées vers `PF2E` sans casser les autres réglages.

## Stockage et partage entre surfaces Owlbear

La source locale est :

```text
src/core/storage/preferences.ts
```

Le provider React global est :

```text
src/core/preferences/AppPreferencesProvider.tsx
```

Il enveloppe :

- le popover principal ;
- le sous-menu Conditions ;
- le sous-menu Stats rapide.

Les différentes iframes Owlbear utilisent la même clé de stockage et écoutent l'événement `storage`. Une modification dans Paramètres peut donc être récupérée par les autres surfaces sans créer une préférence propre à Stats.

Le background non-React peut lire directement `readPreferences()` lorsqu'il doit appliquer une préférence.

## Conditions

Conditions est le premier module réellement dépendant du système de jeu.

Le catalogue runtime système-aware est :

```text
src/features/stats/services/statConditionCatalog.ts
```

Il est dérivé du catalogue maître documentaire et expose :

```text
DND5E  -> 15 conditions
PF2E   -> 42 conditions
GENERIC -> 0 condition actuellement
```

Les 11 concepts partagés D&D5e/PF2e gardent un ID canonique commun, mais leur modèle de valeur peut différer selon le système. Par exemple `frightened` et `stunned` n'ont pas la même intensité dans les deux règles.

Les assets sont indépendants de la langue et utilisent les IDs canoniques :

```text
src/features/stats/assets/condition/Icon/
```

## Compatibilité des anciennes sauvegardes

La migration est non destructive.

Les anciens IDs français utilisés par `statConditions.ts` sont reconnus par des aliases vers les nouveaux IDs canoniques. Exemple :

```text
effraye -> frightened
aveugle -> blinded
blesse  -> wounded
```

Une ancienne condition reste lisible. Lorsqu'elle est modifiée via la nouvelle interface, elle est réécrite sous son ID canonique.

Changer de système ne supprime jamais les conditions déjà stockées sur le token. Les conditions qui n'appartiennent pas au système actif sont simplement absentes de la liste de sélection jusqu'à ce que le système correspondant soit de nouveau choisi.

## Futur Loot Table

Quand Loot Table sera intégré à Tactical GM Suite, il devra consommer `gameSystem` depuis le Core au lieu de créer son propre sélecteur global.

Il pourra conserver ses données et règles spécifiques par système, mais l'identité du système actif doit rester commune à la suite.

## Non-objectifs de ce chantier

Ce socle ne signifie pas :

- traduction immédiate de tout l'addon existant ;
- traduction automatique du contenu historique ;
- ajout de contenu Conditions générique ;
- intégration de Loot Table ;
- ajout de D&D 2024 ;
- automatisation mécanique des effets de conditions.

Ces évolutions nécessitent des chantiers séparés.
