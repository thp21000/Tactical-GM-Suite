# Tactical GM Suite

Tactical GM Suite est une extension modulaire pour MJ sur Owlbear Rodeo. Elle rassemble plusieurs outils tactiques dans une seule extension tout en gardant des frontières nettes entre les modules et en laissant le MJ maître de ses règles.

Stack : React, TypeScript, Vite, SDK Owlbear Rodeo, GitHub Pages.

## État actuel

Modules actifs :

- **Core / Dashboard** : shell, navigation, préférences globales, thème Owlbear, assignation token→joueur et synthèses.
- **Initiative Tracker** : participants, ordre, rounds, tours, états simples et import Owlbear.
- **Distance / Déplacement / Portée** : mesures, lecture de grille, presets et préférences.
- **Stat Tracker / Conditions** : profils token, trackers libres, presets, permissions, conditions, menus contextuels et overlays de scène.

Modules volontairement reportés : Calendar et Loot Table.

## Langue et système de jeu

Préférences globales :

```text
language   = fr | en
gameSystem = DND5E | PF2E | GENERIC
```

La langue possède un drapeau dans le sélecteur. Le système actif possède un état visuel explicite.

Toute nouvelle chaîne ou chaîne modifiée doit être fournie en FR et EN.

Conditions utilise déjà `gameSystem`. Le futur Loot Table devra réutiliser la même préférence.

Voir `docs/LOCALIZATION_AND_SYSTEMS.md`.

## Assignation token → joueur

L’assignation d’un token à un joueur est une donnée Core et ne dépend plus du Stat Tracker.

Un token peut donc être lié à un joueur sans être suivi par Stats.

Dans le clic droit, le sous-menu **Tactical GM Suite** propose actuellement :

```text
Ajouter au Stat Tracker / Retirer du Stat Tracker
Lié à personne / Lié à <nom du joueur>
```

Référence : `docs/TOKEN_PLAYER_ASSIGNMENT.md`.

## Stat Tracker

Stats suit des données libres attachées aux tokens ; il ne s’agit pas d’une fiche de personnage automatisée.

Fonctions principales :

- profils persistés dans les métadonnées Owlbear ;
- ajout/retrait du suivi sans perte du profil ;
- copies et instances de scène ;
- presets ;
- bibliothèque d’icônes PNG ;
- cinq types techniques de tracker ;
- permission `canPlayerEdit` ;
- visibilité `public/private/gm` ;
- affichage `showOnToken` ;
- menu Stats rapide permanent.

Types :

| Type | Usage |
|---|---|
| `bar` | current/max + barre |
| `counter` | valeur modifiable + contrôles rapides |
| `readonly` | valeur fixe visuellement, toujours éditable dans Stats |
| `toggle` | actif/inactif |
| `icon` | 1 à 6 unités cumulatives |

Les calculs inline numériques acceptent notamment `+3`, `-2`, `*2`, `x2`, `×2`, `/2`, `÷2`.

## Conditions

Conditions est un sous-système distinct des trackers.

Un token peut recevoir des Conditions sans être ajouté au Stat Tracker.

Catalogues :

```text
D&D 5e 2014        15 conditions
PF2e Remaster      42 conditions
Générique           0 actuellement
```

La liste est triée selon la langue active et supporte plusieurs conditions simultanées.

Au hover :

- Description ;
- Résumé règles du système actif.

Durées : Manuelle, Rounds, Rencontre, Repos.

Le MJ peut autoriser l’accès des joueurs au menu Conditions via un réglage de room ; ce réglage est désactivé par défaut.

## Conditions dérivées

Certaines relations explicites entre conditions peuvent être automatisées.

Deux modes :

```text
while-active
on-apply
```

Une condition `on-apply` peut ensuite être retirée indépendamment de sa condition maître.

Les relations circonstancielles restent manuelles.

Voir `docs/stats/CONDITION_DERIVATIONS.md`.

## Affichage Conditions sur token

Les Conditions actives utilisent des médaillons PNG autour du token.

La couronne suit proportionnellement la taille réelle du token.

Le niveau n’est pas imprimé sur la scène ; il reste consultable dans le menu Conditions.

Référence : `docs/stats/CONDITIONS_RUNTIME_SYNC.md`.

## Stat Dock — affichage Stats sur token

Les trackers Stats visibles sont regroupés dans une **zone unique** appelée Stat Dock.

Le MJ choisit sa position :

```text
top
bottom
```

Règles :

- pas de cercle ;
- aucun contrôle interactif sur la scène ;
- Conditions et Stats restent totalement séparés ;
- la taille doit suivre la taille réelle du token ;
- le zoom ne doit pas changer la proportion du texte par rapport aux plaques.

Mapping visuel :

```text
readonly/counter -> icône + nom + valeur
toggle           -> icône + nom, couleur/désaturation
bar              -> icône + nom + current/max + barre
icon             -> unités répétées actives/inactives
```

Direction détaillée : `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`.

### État technique actuel

L’entrée publique `statTokenOverlayObrSync.ts` utilise actuellement **V17.1**.

Cette version réutilise la géométrie V12 et conserve les vrais objets `Text` de scène sans les muter après création. Les plaques, shapes et icônes sont placées derrière le texte avec des zIndex négatifs.

Cette décision vient de tests en room :

- `Label` reste visible mais se comporte en screen-space et donne un mauvais résultat au zoom ;
- `Text` suit correctement l’espace scène ;
- modifier layer/zIndex d’un `Text` après création peut le faire disparaître.

Le Stat Dock est donc **encore en stabilisation visuelle/technique**. Il ne doit pas être considéré comme final tant que le test `texte visible + zoom stable + empilement correct` n’est pas validé en room.

## Séparation Stats / Conditions

Invariant :

```text
Stats      -> token.trackers   -> Stat Dock
Conditions -> token.conditions -> badges Conditions
```

Les deux systèmes utilisent des services de synchronisation, métadonnées et triggers distincts.

Une modification Conditions ne doit pas réveiller Stats.

## Préchargement des assets

Le background permanent précharge les PNG dès que Owlbear est prêt :

1. Conditions ;
2. Trackers ;
3. concurrence limitée.

Le background peut ensuite resynchroniser les overlays à partir des profils embarqués.

## Installation Owlbear

Manifest :

```text
https://thp21000.github.io/Tactical-GM-Suite/manifest.json
```

Application :

```text
https://thp21000.github.io/Tactical-GM-Suite/
```

## Développement

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Le workflow Pages exécute typecheck et build avant déploiement.

## Documentation de référence

- `PROJECT_CONTEXT.md` — état opérationnel + journal de session.
- `docs/ARCHITECTURE.md` — frontières d’architecture.
- `docs/LOCALIZATION_AND_SYSTEMS.md` — langue/système/i18n.
- `docs/TOKEN_PLAYER_ASSIGNMENT.md` — assignation transverse token→joueur.
- `docs/features/STATS_V2_SPEC.md` — cahier des charges Stats.
- `docs/stats/README.md` — index technique Stats/Conditions.
- `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md` — Stat Dock.
- `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md` — catalogue canonique.
- `docs/stats/CONDITIONS_RUNTIME_SYNC.md` — overlay Conditions.
- `docs/stats/CONDITION_DERIVATIONS.md` — moteur de dérivation.

## Principes du projet

- garder les modules séparés ;
- garder `App.tsx` léger ;
- ne pas créer de `utils` fourre-tout ;
- ne pas déduire le sens d’un tracker depuis son icône ;
- garder `canPlayerEdit`, `visibility` et `showOnToken` distincts ;
- toute nouvelle chaîne visible doit exister en FR et EN ;
- ne jamais mélanger Stat Dock et Conditions ;
- exécuter typecheck + build après toute modification de code.
