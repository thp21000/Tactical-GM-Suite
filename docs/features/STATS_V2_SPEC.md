# Cahier des charges — Stat Tracker V2

> Source de vérité fonctionnelle Stats — mise à jour au **4 septembre 2026**.

## 1. Objectif général

Stats est un système de suivi tactique de valeurs liées aux tokens Owlbear Rodeo.

Il ne doit pas devenir une fiche de personnage complète ni un moteur d’automatisation D&D/PF2e. Le MJ doit pouvoir créer des trackers libres pour représenter des PV, une CA, des munitions, des charges, de la monnaie, un état narratif ou toute autre information utile.

Règle centrale :

> **Le sens d’un tracker appartient au MJ ; il n’est jamais déduit de son icône.**

Un cœur n’est pas obligatoirement des PV. Un bouclier n’est pas obligatoirement une CA. Un preset peut proposer une association, jamais l’imposer.

## 2. Préférences globales consommées par Stats/Conditions

La langue et le système de jeu sont des préférences du Core, pas des préférences propres à Stats.

Valeurs actuelles :

```text
language   = fr | en
gameSystem = DND5E | PF2E | GENERIC
```

Conditions consomme déjà ces deux préférences.

Règles :

- toute nouvelle chaîne visible ou chaîne existante modifiée doit être fournie en FR et EN ;
- la traduction historique reste progressive ;
- le système actif ne doit modifier que les modules qui en dépendent ;
- un futur Loot Table devra réutiliser la même préférence globale ;
- le mode Générique doit rester disponible même si son catalogue Conditions est vide actuellement.

Voir `docs/LOCALIZATION_AND_SYSTEMS.md`.

## 3. Entités suivies

Types supportés dans le modèle :

- PJ (`pc`)
- PNJ (`npc`)
- Ennemi (`enemy`)
- Monture (`mount`)
- Objet (`object`)
- Piège (`trap`)
- Familier (`familiar`)
- Autre (`other`)

Dans les menus contextuels Owlbear, l’intégration est volontairement limitée aux images des couches :

- `CHARACTER`
- `MOUNT`
- `PROP`

Les maps, murs/dessins, notes, textes, grilles, fog et autres couches ne doivent pas recevoir les menus Stats/Conditions.

## 4. Modèle de données

### 4.1 Token suivi

Un `StatTrackedToken` contient notamment :

- `id` canonique ;
- `sourceItemId` pour l’instance Owlbear courante ;
- nom ;
- type ;
- trackers ;
- conditions ;
- groupe éventuel ;
- joueur assigné ;
- notes ;
- état masqué joueurs ;
- état suivi/non suivi ;
- timestamps.

### 4.2 Tracker

Un `StatTracker` contient notamment :

- `id`
- `name`
- `visualType`
- `iconId`
- `current` optionnel
- `max` optionnel
- `value` optionnel
- `enabled` optionnel
- `visibility`
- `canPlayerEdit`
- `showOnToken`
- timestamps

`skinId` existe encore dans certains types pour compatibilité de lecture, mais le choix de style a été supprimé de l’expérience active.

### 4.3 Conditions

Les conditions sont stockées séparément dans `token.conditions`.

Une condition active peut posséder :

- ID canonique de définition ;
- niveau/valeur selon le système ;
- type de durée ;
- durée/rounds restants ;
- identifiant de rencontre Initiative ;
- round de départ / round d’expiration ;
- source ;
- note ;
- visibilité ;
- timestamps.

Le label, la description, le résumé de règles, l’icône et les capacités de valeur sont lus depuis le catalogue canonique et l’i18n plutôt que dupliqués dans une ancienne définition runtime.

### 4.4 Presets

Un preset associe un type de token à une liste de `StatTrackerInput`.

Un preset :

- préremplit ;
- n’enferme pas ;
- ne donne aucune sémantique obligatoire à une icône ;
- ne doit pas écraser arbitrairement les trackers existants.

## 5. Persistance et identité

### 5.1 Profil embarqué

La configuration durable est écrite dans les métadonnées du token Owlbear sous le lien Stats.

Le profil embarqué doit permettre :

- fermeture/réouverture de l’addon sans perte ;
- retrait du Stat Tracker sans destruction de la configuration ;
- réajout avec restauration ;
- copie d’un token en conservant sa configuration ;
- lecture depuis Dashboard/Stats ;
- stockage des conditions même sans suivi Stats actif.

### 5.2 Retirer n’est pas supprimer

`Retirer du Stat Tracker` désactive le suivi mais ne signifie pas « effacer le profil ».

L’état `tracked` est distinct de l’existence du profil embarqué.

### 5.3 Conditions sans Stat Tracker

Le menu Conditions doit fonctionner indépendamment de l’ajout au Stat Tracker.

Si aucun profil utile n’existe, le système peut créer un profil dormant/condition-only avec :

```text
isTracked = false
trackers = []
```

Le premier ajout réel au Stat Tracker doit ensuite pouvoir initialiser normalement les trackers/presets attendus.

### 5.4 Copies

Plusieurs items Owlbear peuvent représenter des instances d’un même profil.

Le système doit éviter de transformer chaque copie en entité indépendante sans raison et doit synchroniser les instances liées.

### 5.5 Nettoyage

L’objectif produit reste : si la dernière copie physique d’un profil n’existe plus nulle part, aucune donnée centrale inutile ne doit s’accumuler indéfiniment.

La persistance dans les métadonnées des items résout une grande partie du problème puisque les métadonnées disparaissent avec l’item. La garantie d’un nettoyage global de toute référence centrale résiduelle reste toutefois à tester/documenter séparément.

## 6. Bibliothèque d’icônes Trackers

### 6.1 Catégories

1. Corps & Protection (`body`)
2. Arcane & Combat (`arcane`)
3. Ressources & Richesses (`resource`)
4. Objets & Marques (`object`)

Les catégories servent uniquement à parcourir la bibliothèque.

### 6.2 Identité technique

Le nom technique décrit l’objet visuel :

```text
body_heart
body_shield
arcane_rune
resource_coin
object_gear
```

Il ne doit pas encoder directement `hp`, `ac`, `ammo`, etc.

### 6.3 Assets

Les PNG sont chargés par glob depuis :

```text
src/features/stats/assets/icons/
```

Le registre reconnaît la bibliothèque V1 de 48 icônes plus 15 ajouts documentés, soit 63 identifiants connus/documentés.

### 6.4 Couleur d’accent

Chaque icône connue peut avoir une couleur d’accent déclarée.

Cette couleur pilote notamment les barres. Elle ne doit pas être extraite automatiquement depuis le PNG.

## 7. Création / modification d’un tracker

La création et la modification se font dans une modale intégrée au style OBR.

Champs principaux :

- Nom
- Type visuel
- paramètres numériques adaptés au type
- Icône
- Visibilité
- Modification joueur autorisée
- Afficher sur le token

Le sélecteur d’icônes utilise des catégories/tabs et des icônes compactes. Le libellé est disponible au survol.

Le champ `Style` a été supprimé.

## 8. Types visuels actuels

Le type technique reste limité à cinq valeurs :

```ts
"icon" | "bar" | "counter" | "readonly" | "toggle"
```

### 8.1 `bar` — Barre à valeur max

Données principales : `current`, `max`.

Rendu :

- nom centré au-dessus ;
- menu `…` en interface principale MJ ;
- icône à gauche ;
- valeur courante au centre ;
- max à droite ;
- couleur selon l’accent de l’icône ;
- texture liquide/organique ;
- bulles pseudo-aléatoires ;
- désaturation progressive de l’icône vers zéro.

Interactions :

- clic sur valeur ;
- saisie absolue ;
- calcul inline `+3`, `-2`, `*2`, `x2`, `×2`, `/2`, `÷2` ;
- division par zéro refusée ;
- borne 0..max ;
- drag horizontal ;
- clavier : flèches ±1, Home = 0, End = max.

### 8.2 `counter` — Indicateur modifiable

- pastille centrale 48 × 48 px ;
- `-5`, `-1`, `+1`, `+5` ;
- aucune borne métier ;
- valeurs négatives autorisées ;
- édition/calcul inline ;
- pas de drag.

### 8.3 `readonly` — Indicateur fixe

Le nom technique est historique.

- pastille 48 × 48 px ;
- aucun rail ;
- aucun bouton +/- ;
- valeur modifiable par clic/calcul inline ;
- jusqu’à trois par ligne selon la largeur.

Il est « fixe » par sa présentation, pas techniquement immuable.

### 8.4 `toggle`

- pastille 48 × 48 px ;
- icône uniquement ;
- actif = couleur ;
- inactif = désaturé ;
- clic pour basculer ;
- jusqu’à trois par ligne.

### 8.5 `icon` — Indicateur cumulatif

- `current` = unités actives ;
- `max` = nombre total d’icônes ;
- `1 <= max <= 6` ;
- clic inactive N -> active 1..N ;
- clic active N -> désactive N..fin ;
- pas de drag.

## 9. Administration dans l’interface principale

Pour le MJ, les cartes de tracker possèdent un menu `…` contenant :

- Afficher/Masquer sur le token ;
- Modifier ;
- Supprimer.

Les actions d’administration ne doivent pas être réintroduites dans le menu rapide sans décision explicite.

## 10. Presets

Comportement attendu :

- l’ajout d’un token peut appliquer le preset de son type ;
- `Appliquer preset` ajoute les trackers manquants ;
- ne pas écraser automatiquement les trackers existants ;
- éviter les doublons ;
- le MJ peut gérer/réinitialiser les presets.

## 11. Assignation et permissions joueur

Le token conserve :

- `assignedPlayerId`
- `assignedPlayerName`

Pour un joueur :

```text
tracker.canPlayerEdit == true
ET token assigné à ce joueur
=> tracker visible et modifiable dans les interfaces de contrôle
```

Le MJ garde tous les droits.

Ne pas confondre :

```text
canPlayerEdit -> permission de contrôle
visibility    -> audience d'affichage
showOnToken   -> intention d'afficher
```

## 12. Interface principale côté joueur

Le joueur ne doit pas voir une copie de toute l’administration MJ.

Il voit uniquement les tokens qui lui sont assignés et les trackers pour lesquels `canPlayerEdit = true`.

Les actions MJ restent masquées.

## 13. Sous-menu contextuel Stats

Le menu clic droit **Stats** est une interface de changement rapide.

### MJ

Le MJ peut manipuler les trackers du token.

### Joueur

Le menu n’est visible que si :

- le token est assigné au joueur courant ;
- au moins un tracker a `canPlayerEdit = true`.

À l’intérieur, il ne voit que les trackers autorisés.

### Règle UX

Le sous-menu ne permet pas :

- supprimer un tracker ;
- modifier sa configuration ;
- changer `showOnToken`.

Layout :

- `bar`, `counter`, `icon` : pleine largeur ;
- `readonly`, `toggle` : jusqu’à trois par ligne.

## 14. Ajouter / Retirer du Stat Tracker

Le menu contextuel alterne entre :

- Ajouter au Stat Tracker
- Retirer du Stat Tracker

selon l’état `tracked`.

Action MJ uniquement, enregistrée par le background permanent.

## 15. Conditions — catalogue canonique

Conditions et trackers sont indépendants fonctionnellement.

Le catalogue runtime est :

```text
src/features/stats/services/statConditionCatalog.ts
```

Contenu actuel :

```text
DND5E   -> 15 conditions D&D 5e 2014
PF2E    -> 42 conditions PF2e Remaster
GENERIC -> 0 condition actuellement
```

Le catalogue maître documente 46 concepts canoniques, dont 11 partagés entre D&D5e et PF2e.

Une entrée partagée conserve un ID canonique commun mais des règles propres à chaque système.

### 15.1 Pas de catalogue legacy

L’ancien `statConditions.ts`, les anciennes conditions hors catalogue et les aliases de migration ne font plus partie du runtime.

Cette suppression est volontaire tant que l’addon n’a pas de parc utilisateur externe nécessitant une migration.

## 16. Sous-menu Conditions

Le menu clic droit Conditions :

- est enregistré par le background ;
- est disponible sur les tokens éligibles ;
- est actuellement MJ uniquement ;
- utilise la langue et le système globaux ;
- utilise un champ de recherche ;
- affiche une liste compacte ;
- trie la liste alphabétiquement selon le libellé traduit ;
- utilise les assets canoniques dédiés.

### 16.1 Activation et états simultanés

Cliquer une condition inactive permet de la configurer/activer.

Selon la définition, elle peut demander :

- niveau/valeur ;
- durée ;
- visibilité.

Invariant :

> Ajouter ou modifier une condition ne doit jamais désactiver automatiquement une autre condition.

Plusieurs conditions peuvent être actives simultanément.

Une condition active :

- reste identifiable dans la liste ;
- peut être désactivée ;
- peut être modifiée par son action d’édition ;
- conserve ses données sans modifier les autres entrées actives.

### 16.2 Hover

Au survol d’une condition, une carte d’information :

- s’ancre à la ligne survolée ;
- se place au-dessus lorsque l’espace le permet ;
- bascule dessous si nécessaire pour ne pas être coupée ;
- affiche **Description** ;
- affiche **Résumé règles** du système actuellement sélectionné ;
- utilise la langue active.

## 17. Durées Conditions et Initiative

Types de durée :

- Manuelle
- Rounds
- Rencontre
- Repos

`Rounds` et `Rencontre` dépendent d’une participation/rencontre Initiative exploitable.

Le menu doit rendre ces choix indisponibles lorsque le token ne peut pas être rattaché à l’initiative.

Pour les rounds, la condition peut conserver :

- encounter id ;
- round de départ ;
- round d’expiration ;
- rounds restants.

Le background synchronise l’évolution avec Initiative.

## 18. Affichage Conditions sur token

L’ancien système de grands anneaux et les labels numériques de niveau sont abandonnés.

L’affichage actuel repose sur des médaillons PNG autour du token.

Objectifs :

- plusieurs conditions simultanées ;
- icône reconnaissable ;
- niveau consultable dans le menu sans chiffre parasite sur le token ;
- audience respectant la visibilité ;
- proportions stables lorsque la taille du token change.

### 18.1 Géométrie de référence

Valeurs actuelles :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

La légère correction de centre décale visuellement la couronne vers la gauche et le haut.

### 18.2 Redimensionnement proportionnel

La taille des badges suit la taille réelle du token :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Ainsi :

```text
token × 0,5 -> badges × 0,5
token × 2   -> badges × 2
```

Le rayon et l’espacement utilisent la même échelle dynamique.

### 18.3 Niveau

Aucun nouveau label numérique de niveau n’est créé sur la scène.

Le niveau/valeur reste dans les données et dans le menu Conditions.

Le lecteur peut reconnaître l’ancien rôle metadata `level` uniquement pour supprimer d’anciens éléments lors d’un sync.

## 19. Séparation stricte des overlays

### Stats

```text
source = token.trackers
```

### Conditions

```text
source = token.conditions
```

Les deux domaines possèdent :

- clés de métadonnées distinctes ;
- services de synchronisation distincts ;
- cycles d’update distincts.

Une modification de condition ne doit jamais créer, mettre à jour ou faire réapparaître l’overlay Stats.

`useStatTokenOverlayAutoSync` doit ignorer les changements qui ne concernent que Conditions.

Conditions possède son propre auto-sync de géométrie dans le background.

## 20. Préchargement des assets

Le background précharge les PNG au lancement de la room :

1. assets canoniques Conditions ;
2. icônes Trackers.

Concurrence limitée à 4 chargements.

Le préchargement ne doit pas bloquer l’enregistrement des Context Menus.

But : réutiliser le cache navigateur pour accélérer le premier affichage.

## 21. Effets mécaniques

Les définitions peuvent décrire des effets de règles, mais ceux-ci restent informatifs/préparatoires.

Tactical GM Suite ne doit pas automatiquement modifier CA, jets, vitesse, actions ou autres valeurs sans chantier mécanique explicite.

## 22. Découpage historique Stats V2

### V2.1 — Trackers personnalisables

Implémenté.

### V2.2 — Types et presets

Implémenté.

### V2.3 — Assignation joueur

Implémenté et étendu avec permissions réelles/context menu joueur.

### V2.4 — Conditions

Implémenté puis fortement refondu :

- catalogue canonique D&D5e/PF2e ;
- i18n FR/EN ;
- niveaux/valeurs ;
- durées ;
- menu contextuel permanent ;
- conditions indépendantes du suivi Stats ;
- plusieurs conditions simultanées ;
- hover Description/Résumé règles ;
- affichage sur token ;
- synchronisation Initiative ciblée.

### V2.5 — Affichage sur token

Implémenté au-delà de la préparation initiale :

- overlays trackers réels ;
- audiences ;
- badges Conditions séparés ;
- auto-sync géométrique Conditions ;
- resize proportionnel ;
- prise en charge des instances/copies de scène.

## 23. Audio Stats

Une spécification existe dans :

```text
docs/stats/STAT_AUDIO_FEEDBACK_V1.md
```

Aucun service audio runtime n’est considéré comme implémenté actuellement.

## 24. Accessibilité et confort

Les contrôles doivent :

- conserver un feedback visuel sans dépendre de l’audio ;
- supporter le clavier lorsque raisonnable ;
- respecter `prefers-reduced-motion` ;
- garder des tailles lisibles dans le popover et les sous-menus ;
- conserver les scrollbars intégrées ;
- garder le niveau Conditions accessible dans le menu même s’il n’est plus dessiné sur le token ;
- ne pas dépendre uniquement d’une variation de couleur pour identifier langue/système sélectionné.

## 25. Critères de stabilité avant nouvelle grosse étape

Avant d’ouvrir un chantier majeur supplémentaire :

1. typecheck vert ;
2. build vert ;
3. test MJ du panneau Stats ;
4. test clic droit Stats sans ouvrir l’addon ;
5. test Conditions sans token suivi ;
6. test plusieurs conditions simultanées ;
7. test activation/désactivation/édition d’une condition active ;
8. test hover FR/EN et D&D5e/PF2e ;
9. test passage système et tri alphabétique ;
10. test token resize 0,5 / 1 / 2 / 3 cases ;
11. test qu’une action Conditions ne réactive jamais l’overlay Stats ;
12. test copie de token ;
13. test retrait/réajout ;
14. test joueur assigné ;
15. test audiences `public/private/gm` ;
16. test durée Rounds/Rencontre avec Initiative ;
17. test changement de scène/refresh ;
18. test suppression de la dernière copie pour clarifier le nettoyage global.

## 26. Non-objectifs actuels

Ne pas ajouter sans demande explicite :

- fiche complète PF2e/D&D ;
- calcul automatique de CA/attaques/saves ;
- moteur de dégâts ;
- automatisation complète des effets de conditions ;
- contenu Conditions Générique ;
- D&D 2024 ;
- intégration Calendar ;
- intégration Loot Table ;
- déduction du sens d’un tracker depuis son nom/icône ;
- gros chantier de traduction rétroactive globale.

## 27. Règle de compatibilité interne

Les données doivent rester exploitables par les autres modules via des services explicites.

Une intégration future doit utiliser les identifiants et valeurs structurés, et non chercher des mots comme « PV » dans le nom d’un tracker ou supposer qu’un cœur signifie des points de vie.
