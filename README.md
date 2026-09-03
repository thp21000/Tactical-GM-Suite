# Tactical GM Suite

Tactical GM Suite est une extension modulaire pour MJ sur Owlbear Rodeo. Le projet regroupe plusieurs outils tactiques dans une seule interface tout en conservant des frontières nettes entre les modules.

Le projet est développé en React, TypeScript et Vite avec le SDK Owlbear Rodeo, puis déployé sur GitHub Pages.

## État actuel

Modules intégrés :

- **Core / Dashboard** : shell de l’extension, navigation, registre des modules, intégration du thème Owlbear et vues de synthèse.
- **Initiative Tracker** : participants, ordre d’initiative, rounds, tours, états simples et import depuis Owlbear.
- **Distance / Déplacement / Portée** : mesures tactiques entre items Owlbear, lecture de la grille, presets de portée et préférences.
- **Stat Tracker** : suivi avancé de tokens, trackers personnalisables, presets, assignation joueur, permissions réelles, conditions, affichages sur token et contrôles rapides depuis le menu contextuel.

Modules volontairement reportés :

- Calendar
- Loot Table

Calendar et Loot Table ne doivent pas être intégrés tant qu’un chantier explicite ne les ouvre pas.

## Langue et système de jeu

Le Core possède deux préférences globales persistantes :

- **Langue** : Français (`fr`) ou English (`en`), avec drapeau dans le sélecteur ;
- **Système** : D&D 5e (`DND5E`), Pathfinder 2e (`PF2E`) ou Générique (`GENERIC`), avec indicateur visuel explicite du système actif.

La traduction de l’interface historique est progressive. Toute nouvelle chaîne visible ou chaîne reprise dans un chantier doit être fournie simultanément en FR et EN dans les fichiers i18n du module concerné.

Le système actif n’est consommé que par les modules qui en ont besoin. Conditions l’utilise déjà ; le futur module Loot Table devra réutiliser la même préférence globale. Le catalogue Générique reste volontairement vide pour le moment.

Voir [`docs/LOCALIZATION_AND_SYSTEMS.md`](docs/LOCALIZATION_AND_SYSTEMS.md).

## Stat Tracker — état courant

Stats est actuellement le module le plus avancé de la suite. Il ne s’agit pas d’une fiche de personnage complète : le système suit des valeurs libres attachées aux tokens.

Le module comprend notamment :

- profils Stats persistés dans les métadonnées des tokens Owlbear ;
- ajout/retrait du Stat Tracker sans perte de la configuration embarquée ;
- prise en charge des copies d’un même token dans les scènes ;
- presets par type de token ;
- bibliothèque d’icônes PNG classée en quatre catégories ;
- cinq types visuels de trackers ;
- affichage automatique de trackers sélectionnés au-dessus du token ;
- conditions indépendantes du fait qu’un token soit ou non ajouté au Stat Tracker ;
- conditions affichées sur la couronne du token sous forme de petits badges/icônes ;
- durées `Manuelle`, `Rounds`, `Rencontre` et `Repos` ;
- synchronisation des durées `Rounds` / `Rencontre` avec le module Initiative ;
- sous-menu **Conditions** permanent dans le clic droit Owlbear ;
- sous-menu **Stats** de modification rapide permanent dans le clic droit Owlbear ;
- interface joueur limitée aux trackers explicitement autorisés par le MJ.

### Types visuels actuels

| Type technique | Nom UI / usage courant | Interaction principale |
|---|---|---|
| `bar` | Barre à valeur max | barre `current/max`, drag horizontal, valeur centrale éditable |
| `counter` | Indicateur modifiable | `-5`, `-1`, valeur centrale, `+1`, `+5` |
| `readonly` | Indicateur fixe | pastille 48 px, valeur centrale éditable, sans boutons rapides |
| `toggle` | Toggle / case | pastille 48 px, clic couleur ↔ désaturé |
| `icon` | Indicateur à icônes | 1 à 6 icônes cumulatives, clic pour activer/désactiver un niveau |

Les champs numériques éditables acceptent aussi un calcul inline : `+3`, `-2`, `*2`, `x2`, `×2`, `/2` ou `÷2`.

Le nom technique `readonly` est historique : dans l’interface actuelle, l’**Indicateur fixe** reste modifiable par clic direct sur sa valeur, mais n’a pas de boutons `+/-`.

## Menus contextuels Owlbear

Le background permanent de l’extension enregistre les menus même lorsque le popover principal n’est pas ouvert.

Sur les vrais tokens compatibles (`IMAGE` dans les couches `CHARACTER`, `MOUNT` ou `PROP`) :

- **Ajouter au Stat Tracker / Retirer du Stat Tracker** : MJ uniquement ;
- **Conditions** : MJ uniquement ;
- **Stats** : MJ, et joueur assigné lorsqu’au moins un tracker possède `Modification joueur autorisée`.

Le sous-menu **Stats** est volontairement une interface de changement rapide : il n’affiche pas les commandes d’administration `Modifier`, `Supprimer` ou `Afficher sur le token`. Ces actions restent dans l’interface principale.

## Permissions joueur

Un token peut être assigné à un joueur Owlbear.

Dans les interfaces de contrôle Stats :

- le MJ voit et administre tous les trackers ;
- le joueur assigné ne voit que les trackers ayant `canPlayerEdit = true` ;
- ce même joueur peut modifier ces trackers ;
- `Modification joueur autorisée` est indépendante de la visibilité d’overlay `gm/private/public`.

La visibilité d’overlay continue de définir qui voit l’information sur la scène ; la permission d’édition définit qui peut manipuler le tracker dans les interfaces de contrôle.

## Conditions

Conditions est un sous-système distinct des trackers.

Un token peut recevoir des conditions même s’il n’est pas ajouté au Stat Tracker. Dans ce cas, un profil embarqué dormant est utilisé uniquement pour conserver les données nécessaires.

Le menu **Conditions** fournit une recherche et une fenêtre d’ajout avec les paramètres applicables : niveau, durée et visibilité. Au survol d’une condition, il affiche sa description et le résumé des règles correspondant au système actuellement sélectionné, dans la langue active.

Le contenu proposé dépend du système global :

- D&D 5e 2014 : 15 conditions ;
- Pathfinder 2e Remaster : 42 conditions ;
- Générique : catalogue préparé mais vide actuellement.

Le runtime utilise exclusivement les IDs canoniques du nouveau catalogue. Il n’existe plus de catalogue historique ni d’alias de migration pour les anciennes conditions.

Plusieurs conditions peuvent être actives simultanément sur le même token. Chaque ligne active reste visuellement marquée ; cliquer sur une condition active la désactive, tandis que le bouton d’édition permet de modifier uniquement celle-ci.

### Séparation affichage Stats / Conditions

Les deux affichages sont indépendants :

- **Stats** lit uniquement `token.trackers` et produit ses propres labels/overlays ;
- **Conditions** lit uniquement `token.conditions` et produit ses propres badges ;
- les deux systèmes ont des clés de métadonnées Owlbear, des types et des services de synchronisation séparés.

Les badges Conditions sont dimensionnés à un tiers de leur ancienne taille et le premier anneau est centré directement sur le bord de la couronne du token.

Les effets mécaniques décrits dans le catalogue restent informatifs : Tactical GM Suite n’automatise pas actuellement toutes les règles de D&D 5e ou PF2e.

## Installation Owlbear

Manifest :

```text
https://thp21000.github.io/Tactical-GM-Suite/manifest.json
```

Application :

```text
https://thp21000.github.io/Tactical-GM-Suite/
```

Dépôt :

```text
https://github.com/thp21000/Tactical-GM-Suite
```

## Développement local

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Le workflow GitHub Pages exécute le typecheck et le build avant le déploiement.

## Architecture rapide

```text
src/
  core/        fondations communes, thème, constantes, wrappers Owlbear
  features/    modules fonctionnels
  shared/      composants et styles réellement partagés
  i18n/        registre de traduction commun

src/features/
  dashboard/
  initiative/
  range/
  stats/
  settings/
  debug/

docs/
  ARCHITECTURE.md
  LOCALIZATION_AND_SYSTEMS.md
  features/STATS_V2_SPEC.md
  stats/

public/
  manifest.json
```

Stats possède un entrypoint background permanent et deux vues embarquées utilisées par les menus contextuels Owlbear :

- `?view=stats-conditions`
- `?view=stats-trackers`

## Documentation de référence

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) : contexte opérationnel du projet, état réel et journal de session.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : architecture globale et frontières entre modules.
- [`docs/LOCALIZATION_AND_SYSTEMS.md`](docs/LOCALIZATION_AND_SYSTEMS.md) : préférences globales de langue/système et règles i18n.
- [`docs/features/STATS_V2_SPEC.md`](docs/features/STATS_V2_SPEC.md) : cahier des charges et comportement validé du module Stats.
- [`docs/stats/README.md`](docs/stats/README.md) : index technique/visuel du système Stats.
- [`src/features/stats/README.md`](src/features/stats/README.md) : carte du code Stats et état d’implémentation.

## Principes du projet

- garder les modules séparés ;
- ne pas déplacer la logique métier dans `App.tsx` ;
- ne pas créer de dossier `utils` fourre-tout ;
- ne pas déduire la signification d’un tracker à partir de son icône ;
- conserver les données Stats lisibles et exploitables par d’autres modules ;
- les nouveaux textes utilisateur doivent être ajoutés en FR et EN ;
- les modules dépendants d’un système doivent lire la préférence globale plutôt que créer leur propre réglage ;
- ne jamais mélanger l’overlay Stats et l’overlay Conditions ;
- une condition active ne doit jamais désactiver automatiquement une autre condition ;
- lancer `npm run typecheck` et `npm run build` après toute modification de code.
