# Tactical GM Suite — Architecture

> Point de documentation : 2 septembre 2026.

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

Une interaction entre deux modules doit être petite, explicite et documentée. L’exemple actuel est la durée des conditions Stats pilotée par Initiative.

### 2.2 Core minimal

`src/core/` contient uniquement les fondations communes : identifiants, registre de modules, wrappers Owlbear, stockage partagé lorsque nécessaire et thème.

Le Core ne doit pas contenir la logique métier des trackers, des conditions, de l’initiative ou des mesures.

### 2.3 Shared réellement générique

`src/shared/` reçoit uniquement ce qui est réutilisable par plusieurs modules : composants génériques, primitives de style et scrollbars.

Les composants propres à Stats restent dans `src/features/stats/components/`, même s’ils sont visuellement sophistiqués.

### 2.4 Robustesse Owlbear

Toute intégration Owlbear doit :

- attendre que le SDK soit prêt ;
- supporter l’absence ou la transition d’une scène sans faire crasher l’extension ;
- nettoyer abonnements et menus ;
- ne jamais inventer une API SDK ;
- limiter les écritures à ce qui est nécessaire ;
- maintenir une lecture prudente des métadonnées anciennes ou incomplètes.

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

Le projet n’est plus un simple popover React. Il possède plusieurs surfaces runtime.

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

Pour Stats, il enregistre notamment :

- Ajouter au Stat Tracker ;
- Retirer du Stat Tracker ;
- Stats ;
- Conditions ;
- synchronisation des badges de conditions ;
- résumé des permissions joueur nécessaire aux filtres de Context Menu ;
- synchronisation des durées de conditions avec Initiative.

### 4.3 Vues embarquées de Context Menu

`src/main.tsx` route aussi les vues :

```text
?view=stats-conditions
?view=stats-trackers
```

Elles sont embarquées dans les sous-menus Owlbear via `contextMenu.embed`.

Cette séparation est importante : une interface contextuelle doit pouvoir fonctionner sans que le popover principal soit ouvert.

## 5. Arborescence fonctionnelle

```text
src/
  App.tsx
  main.tsx
  background.ts

  core/
    constants/
    modules/
    obr/
    theme/
    ...

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
  features/
    STATS_V2_SPEC.md
  stats/
  ...
```

## 6. Core / Dashboard

Le Core fournit le shell stable de la suite.

Responsabilités :

- navigation ;
- registre des modules ;
- identifiants communs ;
- état de disponibilité Owlbear ;
- thème dérivé du thème Owlbear ;
- primitives de stockage partagées si nécessaire.

Le Dashboard centralise les informations de synthèse qui n’ont pas vocation à encombrer les modules.

Une synthèse Stats a été déplacée vers le Dashboard fin août 2026 afin d’alléger la page Stats.

## 7. Initiative Tracker

Le code Initiative vit dans `src/features/initiative/`.

Responsabilités établies :

- participants ;
- ordre d’initiative ;
- rounds et tours ;
- participants actifs/inactifs ;
- participants vaincus ;
- import depuis Owlbear ;
- stockage partagé adapté à la room.

L’interaction actuellement autorisée avec Stats est ciblée : les conditions de durée `Rounds` et `Rencontre` peuvent référencer la rencontre d’initiative active et être mises à jour avec l’avancement des rounds.

Cela ne transforme pas Initiative en moteur PF2e et n’autorise pas Stats à modifier arbitrairement l’initiative.

## 8. Distance / Déplacement / Portée

Le code Range vit dans `src/features/range/`.

Responsabilités :

- lecture des items Owlbear ;
- origine et cibles ;
- mesure tactique ;
- lecture prudente de la grille ;
- presets de portée ;
- préférences locales.

Aucune automatisation Stats/Range n’est active à ce stade.

## 9. Stat Tracker — architecture courante

Le code Stats vit dans `src/features/stats/`.

### 9.1 Modèle

La structure principale est :

```text
StatTrackerState
  ├─ tokens[]
  │   ├─ trackers[]
  │   └─ conditions[]
  ├─ groups[]
  └─ presets
```

Les trackers ne possèdent aucune sémantique de jeu obligatoire. Le nom, le type visuel, l’icône et les valeurs sont des choix indépendants.

### 9.2 Persistance durable

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
- copier un token peut transporter le profil avec les métadonnées ;
- plusieurs instances de scène peuvent correspondre au même profil canonique ;
- les conditions peuvent être conservées sur un token qui n’est pas activement suivi.

Le `skinId` est désormais un champ de compatibilité historique : il n’est plus sérialisé comme choix de style actif.

### 9.3 Conditions indépendantes

Conditions et Stat Tracker sont fonctionnellement indépendants.

`updateOrCreateEmbeddedConditionToken` peut créer un profil dormant marqué comme hôte de conditions. Le token n’est alors pas considéré comme suivi (`isTracked = false`) mais ses conditions sont persistées.

Cette séparation permet le menu Conditions sur un token qui n’a jamais été ajouté au Stat Tracker.

### 9.4 Context menus

Les menus Stats sont limités aux images appartenant aux couches de token :

```text
CHARACTER
MOUNT
PROP
```

Les maps, grilles, dessins, notes, textes, fog, rulers et autres couches techniques ne sont pas éligibles.

Règles :

- Ajouter/Retirer du Stat Tracker : MJ uniquement ;
- Conditions : MJ uniquement ;
- Stats rapide : MJ, ou joueur assigné ayant au moins un tracker modifiable.

### 9.5 Permissions

Les règles d’édition sont centralisées dans `services/statPermissions.ts`.

Pour les interfaces de contrôle :

```text
MJ -> tous les trackers
Joueur -> uniquement les trackers canPlayerEdit du token qui lui est assigné
```

La visibilité `gm/private/public` est une autre dimension : elle sert à l’audience de l’affichage, pas à décider si un tracker autorisé apparaît dans l’interface de changement rapide.

Comme Owlbear ne peut pas filtrer directement un tableau de trackers dans un Context Menu, un résumé indexable (`playerEditable`, `assignedPlayerId`) est maintenu au niveau des métadonnées du lien. Le profil complet reste la source de vérité.

### 9.6 Overlays

Les anciens documents décrivaient uniquement des overlays manuels. Ce n’est plus l’état courant.

L’architecture contient désormais :

- modèle d’affichage unifié ;
- préparation de payload ;
- plan de rendu ;
- rendu SVG / labels ;
- adaptateur Owlbear ;
- synchronisation automatique des overlays trackers dans la page Stats côté MJ ;
- synchronisation des badges de conditions via le background.

Les champs `showOnToken` et `visibility` restent les commandes d’intention d’affichage.

### 9.7 Copies et scènes

Le code est scene-aware :

- liens token ↔ profil ;
- instances multiples ;
- affichage limité aux instances présentes dans la scène courante ;
- synchronisation des copies d’un même profil.

Point à vérifier avant de le considérer comme totalement clos : il n’a pas été identifié, dans le checkpoint documentaire, de balayage global explicite de **toutes** les scènes pour purger une éventuelle référence canonique orpheline après suppression de la dernière copie. Les métadonnées disparaissent naturellement avec l’item supprimé, mais la stratégie de garbage collection globale doit être testée/documentée séparément si un état central résiduel est concerné.

## 10. Design UI et thème

La couche `shared/styles/obrIntegratedUi.css` harmonise l’ensemble de l’addon avec Owlbear.

Le thème runtime expose les valeurs dérivées du thème OBR, dont l’Overlay Effect utilisé par les interfaces embarquées.

Règles visuelles :

- pas de deuxième design system incompatible dans les sous-menus ;
- scrollbars fines et intégrées ;
- menus contextuels adaptés à la largeur imposée par Owlbear ;
- trackers rapides réutilisent le même renderer que l’interface principale autant que possible ;
- les actions d’administration sont retirées des interfaces de changement rapide.

## 11. Bibliothèque d’icônes Stats

Les PNG sont chargés dynamiquement par :

```ts
import.meta.glob("../assets/icons/**/*.png", ...)
```

Quatre catégories physiques :

```text
Corps & Protection
Arcane & Combat
Ressources & Richesses
Objets & Marques
```

Le registre associe un label et une couleur d’accent aux identifiants connus.

La couleur d’accent est déclarée manuellement ; elle n’est pas extraite automatiquement du PNG. Cela garantit un rendu stable des barres.

Principe non négociable : l’icône ne définit pas le sens du tracker. Une icône de cœur peut être utilisée pour des munitions, du moral ou toute autre valeur.

## 12. Stockage par domaine

| Domaine | Stockage principal |
|---|---|
| préférences personnelles UI | `localStorage` lorsque approprié |
| Initiative partagé | métadonnées/stockage room selon implémentation du module |
| Range presets/préférences | stockage local adapté au module |
| profil Stats durable d’un token | métadonnées du token Owlbear |
| résumé de permission Context Menu | métadonnées du lien Stats |
| état runtime `isItemMetadataSynced` | mémoire uniquement |

Ne pas stocker de gros historiques ou de logs de combat dans les métadonnées des items.

## 13. Frontières entre modules

Interactions actuelles autorisées :

```text
Stats Conditions -> Initiative
  uniquement pour savoir si rounds/rencontre sont disponibles
  et synchroniser les durées
```

Interactions futures possibles mais non implémentées par défaut :

- Initiative lisant un tracker de PV ;
- Range lisant une vitesse/portée ;
- module Combat appliquant une variation de tracker ;
- Calendar influençant des ressources ;
- Loot écrivant dans des ressources.

Aucune de ces possibilités ne doit être ajoutée implicitement.

## 14. Validation et CI

Après une modification TypeScript/React :

```bash
npm run typecheck
npm run build
```

Le workflow GitHub Pages doit rester vert.

Pour une modification documentaire seule, le build n’est techniquement pas requis, mais le workflow de déploiement peut quand même s’exécuter à chaque push.

## 15. Versions

Au checkpoint du 2 septembre 2026 :

- package npm interne : `0.1.0`
- manifest Owlbear : `0.2.38`
- un commit Git porte le jalon `Version 0.3.00`

Cette divergence doit être harmonisée lors d’un futur chantier de versioning ; la documentation ne doit pas inventer laquelle représente la version publique sans modifier les fichiers de version eux-mêmes.

## 16. Sources de vérité documentaires

Pour un nouveau chantier :

1. `PROJECT_CONTEXT.md` — contexte opérationnel, décisions et journal ;
2. `docs/ARCHITECTURE.md` — frontières et architecture ;
3. `docs/features/STATS_V2_SPEC.md` — comportement fonctionnel validé de Stats ;
4. `docs/stats/README.md` — design visuel, assets et index Stats ;
5. `src/features/stats/README.md` — carte du code du module.

Le code courant reste la référence pour savoir ce qui est effectivement implémenté. Une modification validée qui change le comportement doit être répercutée dans la documentation correspondante.
