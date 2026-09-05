# PROJECT_CONTEXT

> Document de contexte opérationnel — Tactical GM Suite  
> Dernière remise à niveau : **5 septembre 2026**.  
> Version du manifest après cette remise à niveau : **0.3.47**.

Ce fichier décrit l’état réel du produit, les décisions stabilisées, les frontières d’architecture, les points ouverts et l’historique nécessaire pour reprendre le projet sans reconstruire le contexte depuis les conversations précédentes.

---

# Projet

**Nom :** Tactical GM Suite  
**Type :** extension modulaire Owlbear Rodeo  
**Dépôt :** `thp21000/Tactical-GM-Suite`

Objectif : regrouper plusieurs outils tactiques pour MJ dans une seule extension, sans transformer Owlbear Rodeo en système entièrement automatisé. Le MJ garde la maîtrise des règles, des données et de la manière de jouer.

Modules actifs :

1. Core / Dashboard
2. Initiative Tracker
3. Distance / Déplacement / Portée
4. Stat Tracker / Conditions

Modules reportés tant qu’aucun chantier explicite ne les ouvre :

5. Calendar
6. Loot Table

---

# URLs et stack

Dépôt :

```text
https://github.com/thp21000/Tactical-GM-Suite
```

GitHub Pages :

```text
https://thp21000.github.io/Tactical-GM-Suite/
```

Manifest Owlbear :

```text
https://thp21000.github.io/Tactical-GM-Suite/manifest.json
```

Stack : React, TypeScript, Vite, Owlbear Rodeo SDK, lucide-react, CSS local, GitHub Pages et GitHub Actions.

Validation attendue après toute modification de code :

```bash
npm run typecheck
npm run build
```

Le workflow `.github/workflows/deploy-pages.yml` exécute ces validations avant le déploiement Pages.

---

# Versioning

Le dépôt garde encore une divergence historique :

```text
package.json          0.1.0
public/manifest.json  0.3.47
```

Le manifest est actuellement la version opérationnelle utilisée pour les modifications du projet. Toute modification réalisée directement sur `main` doit incrémenter ce numéro d’une unité.

Ne jamais déduire une version publiée depuis le nom d’un commit seul.

---

# Principes d’architecture

Le projet reste structuré autour de :

```text
src/core/
src/features/
src/shared/
src/i18n/
```

Règles non négociables :

- ne pas déplacer la logique métier dans `App.tsx` ;
- ne pas créer de dossier `utils` fourre-tout ;
- garder Initiative, Range, Trackers et Conditions comme domaines distincts ;
- toute intégration inter-module doit être volontaire, petite et documentée ;
- le code courant est la référence finale lorsqu’une doc historique contredit le runtime ;
- Calendar et Loot Table restent hors scope sans demande explicite.

---

# Préférences globales — langue et système

Le Core fournit :

```text
language   = fr | en
gameSystem = DND5E | PF2E | GENERIC
```

Valeurs par défaut :

```text
language   = fr
gameSystem = PF2E
```

Décisions :

- sélecteur de langue avec drapeau ;
- système actif avec indication visuelle claire ;
- traduction historique progressive ;
- toute nouvelle chaîne ou chaîne modifiée doit être fournie en FR et EN ;
- un module ne consomme `gameSystem` que s’il en a besoin ;
- Conditions utilise déjà cette préférence ;
- le futur Loot Table devra la réutiliser au lieu de recréer un réglage global.

Référence : `docs/LOCALIZATION_AND_SYSTEMS.md`.

---

# Assignation token → joueur

L’assignation d’un token à un joueur n’appartient plus à Stats.

Source de vérité :

```text
src/core/tokens/tokenPlayerAssignment.ts
```

Un token peut donc être lié à un joueur même s’il n’est pas ajouté au Stat Tracker.

Le clic droit expose un sous-menu `Tactical GM Suite` qui contient actuellement les actions rapides :

```text
Ajouter au Stat Tracker / Retirer du Stat Tracker
Lié à personne / Lié à <nom du joueur>
```

Le sous-menu est un embed Owlbear et doit se comporter comme les autres sous-menus : ouverture au survol, pas de rafraîchissement visuel continu, pas de logique de module dupliquée.

Stats conserve encore un miroir d’assignation dans son profil pour compatibilité avec les permissions actuelles, mais ce miroir n’est plus la source de vérité.

Référence : `docs/TOKEN_PLAYER_ASSIGNMENT.md`.

---

# Stat Tracker — principes fonctionnels

Stats n’est pas une fiche de personnage complète. Un tracker est une donnée libre attachée à un token.

L’addon ne doit jamais déduire la sémantique d’un tracker depuis son icône :

```text
heart != obligatoirement PV
shield != obligatoirement CA
coin != obligatoirement monnaie
```

Le modèle connaît seulement :

```text
nom
type visuel
valeur(s)
icône
permissions
visibilité
affichage sur token
```

## Types techniques

Le runtime conserve cinq types :

```text
bar
counter
readonly
toggle
icon
```

Dans l’interface Stats principale :

- `bar` : current/max, drag, math inline ;
- `counter` : valeur modifiable et contrôles rapides ;
- `readonly` : indicateur fixe sans contrôles rapides, valeur toujours éditable ;
- `toggle` : actif en couleur, inactif désaturé ;
- `icon` : 1 à 6 unités cumulatives.

Les indicateurs `readonly` et `toggle` sont regroupés jusqu’à trois par ligne dans l’interface normale.

Calcul inline accepté :

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

Division par zéro refusée.

---

# Stats — persistance et copies

Les profils sont persistés dans les métadonnées des tokens Owlbear.

Un profil embarque notamment :

- trackers ;
- conditions ;
- assignation miroir ;
- type ;
- groupe ;
- notes ;
- timestamps ;
- état `isTracked`.

`Retirer du Stat Tracker` désactive le suivi sans supprimer la configuration. Réajouter le token doit restaurer le profil.

Le modèle distingue l’ID canonique du profil et `sourceItemId` pour rester scene-aware et supporter les copies.

Point ouvert : vérifier la stratégie globale de garbage collection lorsqu’une dernière copie est supprimée de toutes les scènes.

---

# Conditions — catalogue et menu

Catalogue runtime :

```text
src/features/stats/services/statConditionCatalog.ts
```

Contenu :

```text
DND5E   -> 15 conditions D&D 5e 2014
PF2E    -> 42 conditions PF2e Remaster
GENERIC -> 0 condition actuellement
```

Le catalogue maître contient 46 concepts canoniques. L’ancien catalogue historique et les aliases de migration ne font plus partie du runtime.

Un token peut avoir des Conditions sans être suivi par Stats ; un profil dormant peut exister avec :

```text
isTracked = false
trackers = []
```

Le menu Conditions :

- utilise le système global ;
- est traduit FR/EN pour les parties migrées ;
- trie la liste alphabétiquement selon le libellé traduit ;
- supporte plusieurs conditions actives simultanément ;
- permet de désactiver ou éditer une condition active sans toucher aux autres ;
- affiche au hover la **Description** et le **Résumé règles** du système actif ;
- ancre le hover à la ligne réellement survolée.

Le hover ne doit se déclencher que sur le contenu utile de la ligne — icône ou texte — et non sur toute la largeur vide du bouton.

Durées disponibles : Manuelle, Rounds, Rencontre, Repos. Les durées Rounds/Rencontre utilisent Initiative lorsqu’une rencontre exploitable existe.

---

# Conditions dérivées

Le moteur de dérivation automatise uniquement les relations explicites et sûres.

Deux comportements existent :

```text
while-active
on-apply
```

`while-active` maintient une condition secondaire tant qu’au moins une source maître la maintient.

`on-apply` ajoute la condition au moment de l’activation du maître, puis la condition secondaire devient indépendante et peut être retirée manuellement.

Les relations circonstancielles ou dépendantes d’autres créatures restent manuelles.

Le moteur suit plusieurs sources et distingue une condition ajoutée manuellement d’une condition maintenue automatiquement.

Les conditions automatiques peuvent être indiquées `AUTO` dans le menu, mais aucun marquage supplémentaire n’est ajouté sur les badges autour du token.

Référence : `docs/stats/CONDITION_DERIVATIONS.md`.

---

# Conditions — affichage sur token

Les Conditions utilisent leur propre overlay, totalement indépendant de Stats.

Invariants :

```text
Stats      -> token.trackers   -> Stat Dock
Conditions -> token.conditions -> badges Conditions
```

Une modification Conditions ne doit jamais réveiller l’affichage Stats.

Géométrie Conditions stabilisée :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Formule de resize :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Les badges suivent donc la taille réelle du token. Le niveau n’est jamais écrit sur le badge ; il reste consultable dans le menu.

---

# Préchargement des assets

Le background permanent précharge les PNG dès `OBR.onReady` :

1. Conditions ;
2. Trackers ;
3. concurrence limitée.

Le but est de chauffer le cache navigateur avant l’ouverture des menus et overlays.

Après le préchargement, le background peut reconstruire les Stat Docks depuis les profils embarqués afin d’éviter qu’un overlay ancien ou incomplet reste affiché.

---

# Réglages Stats de room

Source : `src/features/stats/services/statRoomSettings.ts`.

Version actuelle :

```text
STAT_ROOM_SETTINGS_VERSION = 2
```

Réglages :

```text
allowPlayerConditions : boolean
tokenStatsPosition    : top | bottom
```

Valeurs par défaut :

```text
allowPlayerConditions = false
tokenStatsPosition    = top
```

Seul le MJ peut modifier ces réglages.

Lorsque `allowPlayerConditions` est activé, le menu Conditions devient disponible pour les joueurs selon la logique de permission prévue ; l’option est désactivée par défaut.

---

# Stat Dock — direction visuelle validée

Le Stat Dock est l’affichage des trackers Stats sur la scène.

Principes validés :

- tous les trackers Stats d’un token sont regroupés dans **une seule zone** ;
- la zone est au-dessus ou au-dessous du token selon `tokenStatsPosition` ;
- aucun tracker Stats n’est placé en cercle ;
- l’overlay est strictement informatif : aucun bouton, aucun drag, aucun contrôle de données ;
- les Conditions restent totalement séparées ;
- le dock suit la taille réelle du token ;
- le zoom ne doit jamais modifier les proportions internes du dock par rapport au token.

Mapping visuel :

```text
readonly + counter -> Valeur simple : icône + nom + valeur
toggle             -> icône + nom, couleur/désaturation
bar                -> icône + nom + current/max + barre
icon               -> répétition de 1 à 6 tuiles actives/inactives
```

Assets de cadre actuels :

```text
public/assets/stats/stat-plate.svg
public/assets/stats/stat-plate-muted.svg
public/assets/stats/stat-unit.svg
public/assets/stats/stat-unit-muted.svg
```

Référence détaillée : `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`.

---

# Stat Dock — architecture runtime au 5 septembre 2026

Entrée publique :

```text
src/features/stats/services/statTokenOverlayObrSync.ts
```

Elle réexporte actuellement :

```text
statTokenOverlayObrSyncV17
```

Le renderer V17.1 s’appuie volontairement sur la géométrie V12.

Décision technique importante issue des tests en room :

- les objets `Text` de scène créés par V12 ne doivent **pas être mutés après `addItems`** ;
- changer leur layer ou leur `zIndex` après création les a fait disparaître dans plusieurs essais ;
- les `Text` restent donc tels que le builder les crée ;
- plaques, formes et icônes sont placées derrière eux avec des zIndex négatifs ;
- tout reste sur `ATTACHMENT`.

Ordre visuel actuel visé :

```text
Text natif        zIndex 0, non muté
mute shape        zIndex -5
icône PNG         zIndex -10
shape/barre       zIndex -20
plaque SVG        zIndex -30
```

Cette approche est un compromis pour préserver à la fois le comportement scène/zoom et la visibilité du contenu.

## État de validation réel

Les tests successifs V12→V17 ont permis d’isoler plusieurs comportements Owlbear :

- `Label` affiche le texte mais reste en screen-space et change donc de proportion au zoom ;
- `Text` est la bonne primitive pour suivre l’espace scène ;
- déplacer un `Text` vers un autre layer ou lui réécrire un zIndex après création peut le faire disparaître ;
- la géométrie des plaques/icônes est désormais proche de la direction validée ;
- le rendu final texte + zoom + empilement reste à revalider en room après V17.1.

Ne pas considérer le Stat Dock comme visuellement terminé tant que ce test final n’est pas validé.

---

# Menus contextuels permanents

Le background Owlbear fonctionne sans ouverture du popover principal.

Tokens compatibles : images sur `CHARACTER`, `MOUNT`, `PROP`.

Sous-menus actuels :

- `Tactical GM Suite` : assignation joueur + ajout/retrait Stat Tracker ;
- `Stats` : changement rapide des trackers ;
- `Conditions` : gestion des conditions.

Le menu rapide Stats n’expose pas les actions d’administration Modifier/Supprimer/Afficher sur token.

Pour un joueur, Stats dépend de l’assignation Core et de `canPlayerEdit`.

---

# Permissions

Toujours distinguer :

```text
canPlayerEdit
visibility
showOnToken
```

`canPlayerEdit` = droit de modifier la donnée.  
`visibility` = audience de scène.  
`showOnToken` = intention d’affichage dans le Stat Dock.

Ces concepts ne doivent jamais être fusionnés.

---

# Documentation de référence

Ordre recommandé :

1. `PROJECT_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/LOCALIZATION_AND_SYSTEMS.md`
4. `docs/TOKEN_PLAYER_ASSIGNMENT.md`
5. `docs/features/STATS_V2_SPEC.md`
6. `docs/stats/README.md`
7. `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`
8. `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`
9. `docs/stats/CONDITIONS_RUNTIME_SYNC.md`
10. `docs/stats/CONDITION_DERIVATIONS.md`
11. `src/features/stats/README.md`

Le code courant reste la référence finale pour le comportement réel.

---

# Points ouverts / dette connue

## Priorité immédiate

- valider V17.1 en room : texte visible, proportions stables au zoom, contenu correctement empilé ;
- seulement après cette validation, reprendre le polish visuel fin du Stat Dock ;
- vérifier le rendu avec tokens 0,5 / 1 / 2 / 3 cases ;
- vérifier plusieurs audiences public/private/gm sur un même dock ;
- vérifier le `+N` au-delà de six trackers.

## Technique

- garbage collection globale après suppression de la dernière copie ;
- propagation immédiate multi-client des modifications rapides joueur ;
- harmonisation future `package.json` / manifest / stratégie de release ;
- documentation/migration si `STAT_TOKEN_PROFILE_VERSION` évolue.

## UX

- finaliser taille, densité, typographie et proportions du Stat Dock après stabilisation technique ;
- vérifier noms longs et valeurs extrêmes ;
- conserver la distinction visuelle forte entre Conditions et Stats.

## Futur

- audio Stats ;
- automatisations Conditions supplémentaires uniquement après validation de règles ;
- Calendar ;
- Loot Table.

---

# Journal de session / historique détaillé

Cette section doit rester suffisamment précise pour qu’une prochaine session comprenne non seulement ce qui existe, mais aussi pourquoi certaines décisions techniques ont été prises.

## 22 juin 2026 — fondation de la suite

Mise en place du Core/Dashboard, de l’architecture modulaire et de l’ordre de développement. Initiative, Range puis Stats sont ouverts comme modules séparés. Calendar et Loot Table sont explicitement reportés.

## 2 septembre 2026 — refonte majeure Stats

- modernisation de la modale Ajouter/Modifier tracker ;
- bibliothèque PNG classée en quatre catégories ;
- suppression progressive du concept de skin actif ;
- stabilisation des cinq types techniques ;
- presets, profils embarqués, copies de token, permissions et menus rapides ;
- séparation entre page Stats opérationnelle et synthèse Dashboard.

## 3–4 septembre 2026 — langue, systèmes et Conditions canoniques

- fondation globale FR/EN ;
- préférence système D&D5e/PF2e/Générique ;
- drapeaux langue et indicateur visuel du système sélectionné ;
- catalogue canonique Conditions : 15 D&D5e, 42 PF2e, union de 46 concepts ;
- suppression des anciennes références de conditions et de la transition legacy ;
- branchement des 46 PNG canoniques ;
- hover Description + Résumé règles ;
- tri alphabétique ;
- plusieurs conditions actives simultanément ;
- couronne Conditions redimensionnée proportionnellement au token ;
- suppression du niveau sur les badges ;
- séparation stricte des overlays Stats et Conditions.

## 4 septembre 2026 — assignation joueur et menus contextuels

- déplacement du lien token→joueur hors de Stats vers le Core ;
- ajout du sous-menu `Tactical GM Suite` au clic droit ;
- action Ajouter/Retirer du Stat Tracker ;
- action `Lié à personne / Lié à <joueur>` ;
- comportement au survol harmonisé avec les autres sous-menus ;
- correction d’un rafraîchissement continu qui provoquait un clignotement du menu ;
- ajout du réglage MJ `allowPlayerConditions`, désactivé par défaut.

## 4–5 septembre 2026 — conditions dérivées

Un moteur de relations entre conditions est ajouté avec deux modes :

```text
while-active
on-apply
```

La règle essentielle est de ne pas rendre toute condition automatique « non désactivable ». Certaines conséquences sont seulement appliquées à l’activation, puis deviennent indépendantes. Les interactions circonstancielles restent manuelles.

## 5 septembre 2026 — conception du Stat Dock

La direction visuelle des indicateurs Stats sur token est redéfinie depuis zéro.

Décisions :

- tous les indicateurs Stats dans une seule zone ;
- position globale haut/bas ;
- aucun affichage en cercle ;
- aucun contrôle de données sur la scène ;
- quatre familles visuelles issues des cinq types techniques ;
- plaques dark-fantasy compactes avec icône forte et information courte ;
- `icon` = unités répétées actives/inactives, pas une Condition.

La spec `STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md` est créée puis implantée.

## 5 septembre 2026 — itérations techniques Stat Dock V12→V17.1

Le chantier a nécessité plusieurs itérations parce que les primitives Owlbear ne se comportent pas toutes de la même manière au zoom et lors d’une mutation après création.

### Première implantation

Le payload de l’overlay est enrichi pour conserver les vraies données des trackers au lieu de fabriquer un simple label texte. Le réglage `tokenStatsPosition` est ajouté aux paramètres de room.

### Problèmes identifiés

Les premiers rendus montrent successivement :

- plaques trop grandes et trop techniques ;
- textes microscopiques ;
- `Label` qui change de proportion avec le zoom ;
- contenu masqué par les plaques selon l’empilement ;
- `Text` qui disparaît lorsqu’il est déplacé de layer ou muté après création.

### Leçons stabilisées

- les Conditions n’ont pas ce problème car leur overlay est essentiellement image-based ;
- un `Label` n’est pas acceptable pour une donnée qui doit suivre l’échelle du token ;
- les vrais `Text` de scène sont nécessaires pour respecter le zoom ;
- la géométrie V12 est le point de départ le plus fiable ;
- ne pas modifier un objet `Text` après son ajout à la scène ;
- ordonner uniquement les objets graphiques derrière le texte.

### État V17.1

Le renderer public pointe sur `statTokenOverlayObrSyncV17`.

V17.1 :

- réutilise la création V12 ;
- laisse les `Text` natifs intacts ;
- garde tous les objets sur `ATTACHMENT` ;
- place uniquement plaques, shapes et icônes à des zIndex négatifs ;
- conserve la reconstruction du dock depuis le background après préchargement.

La géométrie graphique est nettement plus proche de la direction validée, mais le résultat texte + zoom + ordre d’affichage doit encore être confirmé en room avant de considérer ce chantier comme stabilisé.

## 5 septembre 2026 — checkpoint documentaire 0.3.47

Cette remise à niveau met en cohérence :

- `PROJECT_CONTEXT.md` ;
- `README.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/stats/README.md` ;
- `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`.

Le manifest est incrémenté de `0.3.46` à `0.3.47` dans le même commit documentaire.
