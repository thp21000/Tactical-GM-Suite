# Tactical GM Suite — Architecture

> Point de documentation : **4 septembre 2026**.

## 1. But du projet

Tactical GM Suite est une extension Owlbear Rodeo modulaire destinée aux MJ. Elle regroupe des outils tactiques qui doivent pouvoir coopérer sans mélanger leurs responsabilités.

Ordre de développement validé :

1. Core / Dashboard
2. Initiative Tracker
3. Distance / Déplacement / Portée
4. Stat Tracker
5. intégration Calendar
6. intégration Loot Table

Les quatre premiers blocs sont présents. Calendar et Loot Table restent explicitement reportés.

## 2. Principes d’architecture

### 2.1 Séparation par module

La logique spécifique doit rester dans son feature :

```text
src/features/dashboard/
src/features/initiative/
src/features/range/
src/features/stats/
src/features/settings/
```

Une interaction entre deux modules doit être petite, explicite et documentée.

Exemples actuels :

- Conditions lit Initiative uniquement pour les durées `Rounds` / `Rencontre` ;
- Conditions lit les préférences globales uniquement pour la langue et le système ;
- Stats trackers et Conditions ne partagent pas leur moteur d’overlay.

### 2.2 Core minimal mais transversal

`src/core/` contient les fondations communes :

- identifiants ;
- registre de modules ;
- wrappers Owlbear ;
- thème ;
- préférences globales ;
- stockage partagé des préférences lorsqu’il est réellement transversal.

Le Core ne doit pas contenir la logique métier des trackers, des conditions, de l’initiative ou des mesures.

### 2.3 Shared réellement générique

`src/shared/` reçoit uniquement ce qui est réutilisable par plusieurs modules : composants génériques, primitives de style et scrollbars.

Les composants propres à Stats restent dans `src/features/stats/components/` ou `src/features/stats/context/`.

### 2.4 Robustesse Owlbear

Toute intégration Owlbear doit :

- attendre que le SDK soit prêt ;
- supporter l’absence ou la transition d’une scène sans faire crasher l’extension ;
- nettoyer abonnements et menus ;
- ne jamais inventer une API SDK ;
- limiter les écritures à ce qui est nécessaire ;
- maintenir une lecture prudente des métadonnées utiles ;
- séparer les cycles de synchronisation de domaines différents.

## 3. Stack et pipeline

Stack actuelle :

- React
- TypeScript
- Vite
- `@owlbear-rodeo/sdk`
- `lucide-react`
- CSS local au projet

Commandes de validation :

```bash
npm run typecheck
npm run build
```

Le déploiement GitHub Pages passe par `.github/workflows/deploy-pages.yml`.

## 4. Entrypoints runtime

Le projet possède plusieurs surfaces runtime.

### 4.1 Popover principal

`src/main.tsx` charge normalement `<App />`.

Le popover principal, déclaré dans `public/manifest.json`, mesure actuellement 560 × 720 px.

`App.tsx` doit rester un shell : navigation et routage léger, sans logique métier de module.

### 4.2 Background Owlbear permanent

Le manifest déclare :

```text
background_url = .../background.html
```

Le background initialise les comportements qui doivent rester actifs même si l’utilisateur n’a pas ouvert le popover principal.

Pour Stats/Conditions, il gère notamment :

- Ajouter au Stat Tracker ;
- Retirer du Stat Tracker ;
- Stats ;
- Conditions ;
- préchargement des assets PNG ;
- synchronisation autonome des badges Conditions ;
- résumé des permissions joueur nécessaire aux filtres de Context Menu ;
- synchronisation des durées Conditions avec Initiative.

Le préchargement des assets est non bloquant : Conditions en priorité, puis Stats, avec concurrence limitée.

### 4.3 Vues embarquées de Context Menu

`src/main.tsx` route aussi les vues :

```text
?view=stats-conditions
?view=stats-trackers
```

Elles sont embarquées dans les sous-menus Owlbear via `contextMenu.embed`.

Cette séparation est importante : une interface contextuelle doit pouvoir fonctionner sans que le popover principal soit ouvert.

## 5. Préférences globales, i18n et système

Les préférences transversales vivent dans le Core.

Fichiers clés :

```text
src/core/storage/preferences.ts
src/core/preferences/AppPreferencesProvider.tsx
src/i18n/index.tsx
```

Préférences actuelles :

```text
language   = fr | en
gameSystem = DND5E | PF2E | GENERIC
```

Règles :

- langue et système sont globaux ;
- un module ne doit les consommer que s’il en a besoin ;
- un futur Loot Table doit réutiliser ces préférences ;
- toute nouvelle chaîne ou chaîne modifiée doit être fournie en FR et EN ;
- la traduction historique reste progressive.

Les vues contextuelles utilisent le même provider et la même clé de stockage que le popover principal.

Voir `docs/LOCALIZATION_AND_SYSTEMS.md`.

## 6. Arborescence fonctionnelle

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
  icon.svg
  condition.svg
  ...

docs/
  ARCHITECTURE.md
  LOCALIZATION_AND_SYSTEMS.md
  features/
    STATS_V2_SPEC.md
  stats/
    CONDITIONS_MASTER_CATALOG_V1.md
    CONDITIONS_RUNTIME_SYNC.md
    README.md
```

## 7. Core / Dashboard

Le Core fournit le shell stable de la suite.

Responsabilités :

- navigation ;
- registre des modules ;
- identifiants communs ;
- état de disponibilité Owlbear ;
- thème dérivé du thème Owlbear ;
- langue/système ;
- primitives de stockage partagé réellement transversales.

Le Dashboard centralise les informations de synthèse qui n’ont pas vocation à encombrer les modules.

## 8. Initiative Tracker

Le code Initiative vit dans `src/features/initiative/`.

Responsabilités établies :

- participants ;
- ordre d’initiative ;
- rounds et tours ;
- participants actifs/inactifs ;
- participants vaincus ;
- import depuis Owlbear ;
- stockage partagé adapté à la room.

L’interaction actuellement autorisée avec Conditions est ciblée : les durées `Rounds` et `Rencontre` peuvent référencer la rencontre active et être mises à jour avec l’avancement des rounds.

Cela ne transforme pas Initiative en moteur PF2e/D&D et n’autorise pas Stats à modifier arbitrairement l’initiative.

## 9. Distance / Déplacement / Portée

Le code Range vit dans `src/features/range/`.

Responsabilités :

- lecture des items Owlbear ;
- origine et cibles ;
- mesure tactique ;
- lecture prudente de la grille ;
- presets de portée ;
- préférences locales.

Aucune automatisation Stats/Range n’est active à ce stade.

## 10. Stat Tracker — architecture courante

Le code Stats vit dans `src/features/stats/`.

### 10.1 Modèle

Structure principale :

```text
StatTrackerState
  ├─ tokens[]
  │   ├─ trackers[]
  │   └─ conditions[]
  ├─ groups[]
  └─ presets
```

Les trackers ne possèdent aucune sémantique de jeu obligatoire. Le nom, le type visuel, l’icône et les valeurs sont des choix indépendants.

### 10.2 Persistance durable

La configuration liée à un token est embarquée dans les métadonnées Owlbear via la clé de lien Stats.

Le profil embarqué contient notamment :

- type de token ;
- trackers ;
- conditions ;
- assignation joueur ;
- groupe ;
- notes ;
- état `tracked` ;
- timestamps.

Conséquences :

- retirer un token du Stat Tracker peut conserver son profil ;
- le réajouter restaure sa configuration ;
- copier un token peut transporter le profil ;
- plusieurs instances de scène peuvent correspondre au même profil canonique ;
- les conditions peuvent être conservées sur un token non suivi.

### 10.3 Conditions indépendantes du suivi Stats

Conditions peut créer/maintenir un profil dormant condition-only avec `isTracked = false` et `trackers = []`.

Le menu Conditions n’exige donc pas que le token ait d’abord été ajouté au Stat Tracker.

Cette indépendance fonctionnelle ne signifie pas que les données doivent nécessairement vivre dans un stockage totalement séparé : elles partagent aujourd’hui le profil embarqué, mais leurs services, interfaces et overlays doivent rester distincts.

### 10.4 Context menus

Les menus Stats sont limités aux images appartenant aux couches :

```text
CHARACTER
MOUNT
PROP
```

Règles :

- Ajouter/Retirer du Stat Tracker : MJ uniquement ;
- Conditions : MJ uniquement ;
- Stats rapide : MJ, ou joueur assigné ayant au moins un tracker modifiable.

### 10.5 Permissions

Les règles d’édition sont centralisées dans `services/statPermissions.ts`.

Pour les interfaces de contrôle :

```text
MJ -> tous les trackers
Joueur -> uniquement les trackers canPlayerEdit du token qui lui est assigné
```

La visibilité `gm/private/public` est une autre dimension : elle sert à l’audience de l’affichage, pas à décider si un tracker autorisé apparaît dans l’interface de changement rapide.

Comme Owlbear ne peut pas filtrer directement un tableau de trackers dans un Context Menu, un résumé indexable (`playerEditable`, `assignedPlayerId`) est maintenu au niveau des métadonnées du lien. Le profil complet reste la source de vérité.

## 11. Conditions — catalogue et runtime

Le catalogue canonique runtime est :

```text
src/features/stats/services/statConditionCatalog.ts
```

Il expose :

```text
DND5E   -> 15
PF2E    -> 42
GENERIC -> 0 actuellement
```

Le runtime n’utilise plus l’ancien catalogue `statConditions.ts` ni des aliases de migration.

Les nouvelles icônes canoniques sont résolues depuis :

```text
src/features/stats/assets/condition/Icon/
```

La liste Conditions :

- est triée selon le libellé traduit ;
- permet plusieurs conditions actives simultanément ;
- permet désactivation et édition ciblée ;
- affiche au hover Description + Résumé règles du système actif.

## 12. Overlays — frontière stricte

### 12.1 Overlay Stats

L’overlay Stats lit les trackers et utilise sa propre chaîne de rendu/synchronisation.

`hooks/useStatTokenOverlayAutoSync.ts` ne doit pas resynchroniser Stats sur un changement qui ne concerne que les conditions.

### 12.2 Overlay Conditions

L’overlay Conditions lit `token.conditions` et utilise :

```text
services/statConditionOverlayObrSync.ts
services/statConditionOverlayAutoSync.ts
```

Il possède sa propre clé de métadonnées Owlbear.

Une action Conditions ne doit jamais faire réapparaître l’overlay Stats.

### 12.3 Géométrie Conditions

Les badges suivent proportionnellement la taille du token.

Valeurs de référence actuelles :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Formule principale :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Le rayon de couronne utilise la même échelle afin de conserver les proportions.

Aucun chiffre de niveau n’est généré sur le token ; le niveau reste consultable dans le menu Conditions.

Voir `docs/stats/CONDITIONS_RUNTIME_SYNC.md`.

## 13. Copies et scènes

Le code Stats est scene-aware :

- liens token ↔ profil ;
- instances multiples ;
- affichage limité aux instances présentes dans la scène courante ;
- synchronisation des copies d’un même profil.

Point restant à vérifier : la stratégie de garbage collection globale après suppression de la dernière copie à travers toutes les scènes.

## 14. Design UI et thème

La couche `shared/styles/obrIntegratedUi.css` harmonise l’ensemble de l’addon avec Owlbear.

Règles visuelles :

- pas de deuxième design system incompatible dans les sous-menus ;
- scrollbars fines et intégrées ;
- menus contextuels adaptés à la largeur imposée par Owlbear ;
- trackers rapides réutilisent le même renderer que l’interface principale autant que possible ;
- les actions d’administration sont retirées des interfaces de changement rapide ;
- les sélecteurs de langue/système doivent avoir un état actif lisible ;
- le hover Conditions doit rester attaché à l’élément survolé.

## 15. Bibliothèques d’assets

### Trackers

```text
src/features/stats/assets/icons/
  Corps & Protection/
  Arcane & Combat/
  Ressources & Richesses/
  Objets & Marques/
```

Le registre associe labels et accents. L’icône ne définit jamais le sens du tracker.

### Conditions

```text
src/features/stats/assets/condition/Icon/
```

Les PNG Conditions sont indépendants de la langue et du système ; les règles/labels viennent du catalogue et de l’i18n.

Le background précharge les PNG afin de réduire la latence au premier affichage.

## 16. Stockage par domaine

| Domaine | Stockage principal |
|---|---|
| langue/système | préférences Core persistantes locales |
| Initiative partagé | stockage room selon le module |
| Range presets/préférences | stockage local adapté au module |
| profil Stats durable d’un token | métadonnées du token Owlbear |
| conditions d’un token | champ structuré du profil embarqué |
| résumé de permission Context Menu | métadonnées du lien Stats |
| état runtime transient | mémoire uniquement |

Ne pas stocker de gros historiques ou de logs de combat dans les métadonnées des items.

## 17. Frontières entre modules

Interactions actuelles autorisées :

```text
Conditions -> Initiative
  uniquement pour disponibilité et synchronisation des durées

Conditions -> Core Preferences
  uniquement pour langue et système

Tous les modules UI -> Core Theme/i18n
  uniquement via les fondations partagées prévues
```

Interactions futures possibles mais non implémentées par défaut :

- Initiative lisant un tracker de PV ;
- Range lisant une vitesse/portée ;
- module Combat appliquant une variation de tracker ;
- Calendar influençant des ressources ;
- Loot écrivant dans des ressources.

Aucune de ces possibilités ne doit être ajoutée implicitement.

## 18. Validation et CI

Après une modification TypeScript/React :

```bash
npm run typecheck
npm run build
```

Le workflow GitHub Pages doit rester vert.

Pour une modification documentaire seule, le build n’est pas techniquement requis, mais le workflow peut s’exécuter à chaque push.

## 19. Versions

Au checkpoint du 4 septembre 2026 :

- `package.json` : `0.1.0` ;
- `public/manifest.json` : `0.2.38` ;
- le dépôt possède des commits de jalon allant au moins jusqu’à `Version 0.3.10`.

Cette divergence est volontairement laissée comme dette documentaire/technique : ne pas annoncer une version publique sur la seule base du nom d’un commit.

## 20. Sources de vérité documentaires

Pour un nouveau chantier :

1. `PROJECT_CONTEXT.md` — contexte opérationnel, décisions et journal ;
2. `docs/ARCHITECTURE.md` — frontières et architecture ;
3. `docs/LOCALIZATION_AND_SYSTEMS.md` — langue/système ;
4. `docs/features/STATS_V2_SPEC.md` — comportement fonctionnel validé de Stats ;
5. `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md` — catalogue canonique ;
6. `docs/stats/CONDITIONS_RUNTIME_SYNC.md` — runtime Conditions ;
7. `docs/stats/README.md` — design visuel et index Stats ;
8. `src/features/stats/README.md` — carte du code.

Le code courant reste la référence finale pour savoir ce qui est effectivement implémenté. Une modification validée qui change le comportement doit être répercutée dans la documentation correspondante.
