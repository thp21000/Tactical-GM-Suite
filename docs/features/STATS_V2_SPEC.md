# Cahier des charges — Stat Tracker V2

> Source de vérité fonctionnelle Stats — mise à jour au 2 septembre 2026.

## 1. Objectif général

Stats est un système de suivi tactique de valeurs liées aux tokens Owlbear Rodeo.

Il ne doit pas devenir une fiche de personnage complète ni un moteur d’automatisation PF2e. Le MJ doit pouvoir créer des trackers libres pour représenter des PV, une CA, des munitions, des charges, de la monnaie, un état narratif ou toute autre information utile.

La règle centrale est :

> **Le sens d’un tracker appartient au MJ ; il n’est jamais déduit de son icône.**

Un cœur n’est pas obligatoirement des PV. Un bouclier n’est pas obligatoirement une CA. Un preset peut proposer une association, jamais l’imposer.

## 2. Entités suivies

Types supportés dans le modèle :

- PJ (`pc`)
- PNJ (`npc`)
- Ennemi (`enemy`)
- Monture (`mount`)
- Objet (`object`)
- Piège (`trap`)
- Familier (`familiar`)
- Autre (`other`)

Dans les menus contextuels Owlbear, l’intégration est volontairement limitée aux vrais tokens/images des couches :

- `CHARACTER`
- `MOUNT`
- `PROP`

Les maps, murs/dessins, notes, textes, grilles, fog et autres couches ne doivent pas recevoir les menus Stats.

## 3. Modèle de données

### 3.1 Token suivi

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

### 3.2 Tracker

Un `StatTracker` contient :

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

`skinId` existe encore dans les types pour lire d’anciennes données, mais le choix de style a été supprimé de l’expérience active. Le style est dérivé du renderer et de la couleur d’accent de l’icône.

### 3.3 Conditions

Les conditions sont stockées séparément dans `token.conditions`.

Une condition active peut posséder :

- définition/identifiant ;
- label et icône ;
- niveau/valeur ;
- type de durée ;
- durée/rounds restants ;
- identifiant de rencontre Initiative ;
- round de départ / round d’expiration ;
- source ;
- note ;
- visibilité ;
- métadonnées d’affichage token.

### 3.4 Presets

Un preset associe un type de token à une liste de `StatTrackerInput`.

Un preset :

- préremplit ;
- n’enferme pas ;
- ne donne aucune sémantique obligatoire à une icône ;
- ne doit pas écraser arbitrairement les trackers existants.

## 4. Persistance et identité

### 4.1 Profil embarqué

La configuration durable est écrite dans les métadonnées du token Owlbear sous le lien Stats.

Le profil embarqué doit permettre :

- fermeture/réouverture de l’addon sans perte ;
- retrait du Stat Tracker sans destruction de la configuration ;
- réajout avec restauration ;
- copie d’un token en conservant sa configuration ;
- lecture depuis le Dashboard ou le panneau Stats ;
- stockage des conditions même sans suivi Stats actif.

### 4.2 Retirer n’est pas supprimer

`Retirer du Stat Tracker` désactive le suivi mais ne signifie pas « effacer le profil ».

L’état `tracked` est distinct de l’existence du profil embarqué.

### 4.3 Conditions sans Stat Tracker

Le menu Conditions doit fonctionner indépendamment de l’ajout au Stat Tracker.

Si aucun profil Stats n’existe, le système peut créer un profil dormant/condition-only avec :

```text
isTracked = false
trackers = []
```

Le premier ajout réel au Stat Tracker doit ensuite pouvoir initialiser normalement les trackers/presets attendus.

### 4.4 Copies

Plusieurs items Owlbear peuvent représenter des instances d’un même profil.

Le système doit éviter de transformer chaque copie en entité indépendante sans raison et doit synchroniser les instances liées.

### 4.5 Nettoyage

L’objectif produit reste : si la dernière copie physique d’un profil n’existe plus nulle part, aucune donnée centrale inutile ne doit s’accumuler indéfiniment.

Au checkpoint actuel, la persistance dans les métadonnées des items résout une grande partie du problème puisque les métadonnées disparaissent avec l’item. En revanche, un balayage global explicite de toutes les scènes pour purger d’éventuelles références centrales résiduelles n’a pas été identifié comme une garantie démontrée. Ce point reste à tester/valider avant de le déclarer clos.

## 5. Bibliothèque d’icônes

### 5.1 Catégories

Quatre catégories principales :

1. Corps & Protection (`body`)
2. Arcane & Combat (`arcane`)
3. Ressources & Richesses (`resource`)
4. Objets & Marques (`object`)

Les catégories servent uniquement à parcourir la bibliothèque.

### 5.2 Identité technique

Le nom technique est descriptif de l’objet visuel :

```text
body_heart
body_shield
arcane_rune
resource_coin
object_gear
```

Il ne doit pas être nommé `hp`, `ac`, `ammo`, etc.

### 5.3 Assets

Les PNG sont chargés par glob depuis :

```text
src/features/stats/assets/icons/
```

Le registre reconnaît actuellement la bibliothèque V1 de 48 icônes plus 15 ajouts documentés, soit **63 identifiants connus**.

La présence effective dans l’UI dépend de la présence du PNG dans les dossiers chargés.

### 5.4 Couleur d’accent

Chaque icône connue peut avoir une couleur d’accent déclarée.

Cette couleur pilote notamment les barres et certains halos.

Elle ne doit pas être extraite automatiquement depuis le PNG : la palette déclarée garantit une UI stable.

### 5.5 Fallback

Une icône inconnue/legacy est normalisée vers un alias connu puis, si nécessaire, vers `object_circle` ou le premier asset disponible.

## 6. Création / modification d’un tracker

La création et la modification se font dans une modale professionnelle intégrée au style OBR.

Champs principaux :

- Nom
- Type visuel
- paramètres numériques adaptés au type
- Icône
- Visibilité
- Modification joueur autorisée
- Afficher sur le token

Le sélecteur d’icônes utilise des catégories/tabs et des icônes compactes. Le libellé est disponible au survol plutôt que sous chaque asset.

Le champ `Style` a été supprimé.

## 7. Types visuels actuels

Le type technique reste limité à cinq valeurs pour compatibilité :

```ts
"icon" | "bar" | "counter" | "readonly" | "toggle"
```

Le comportement UI courant a évolué par rapport aux premières spécifications.

### 7.1 `bar` — Barre à valeur max

Données principales :

```text
current
max
```

Rendu :

- nom centré au-dessus ;
- menu `…` en interface principale MJ ;
- pastille d’icône à gauche ;
- barre fantasy commune ;
- valeur courante au centre ;
- `max X` à droite ;
- remplissage coloré selon l’accent de l’icône.

Texture :

- teinte plus sombre à gauche ;
- progression lumineuse vers la droite ;
- bulles pseudo-aléatoires ;
- aucune bulle à 0 ;
- densité de bulles croissante avec le ratio `current/max` ;
- bord du remplissage organique/ondulé lorsqu’il est partiel ;
- icône progressivement désaturée à mesure que la valeur approche 0.

Interactions :

- clic sur la valeur centrale pour édition ;
- saisie absolue : `12` ;
- calcul inline : `+3`, `-2`, `*2`, `x2`, `×2`, `/2`, `÷2` ;
- division par zéro refusée ;
- valeur bornée entre 0 et max ;
- clic/drag horizontal sur la barre pour régler rapidement la valeur ;
- clavier : flèches ±1, Home = 0, End = max.

### 7.2 `counter` — Indicateur modifiable

Donnée principale :

```text
value
```

Rendu :

- nom centré au-dessus ;
- rail fantasy ;
- pastille centrale 48 × 48 px avec icône et valeur ;
- `-5`, `-1` à gauche ;
- `+1`, `+5` à droite.

Interactions :

- aucune valeur min/max imposée ;
- valeurs négatives autorisées ;
- clic sur la valeur centrale pour saisie directe/calcul inline ;
- pas de drag sur le rail.

La zone numérique centrale doit rester transparente afin de ne pas masquer l’icône.

### 7.3 `readonly` — Indicateur fixe

Le nom technique `readonly` est historique.

Comportement produit actuel :

- pastille 48 × 48 px ;
- icône ;
- valeur centrale ;
- aucun rail ;
- aucun bouton `+/-` ;
- valeur modifiable par clic direct ;
- même calcul inline que les autres champs numériques.

Il s’agit donc d’un **indicateur fixe dans sa présentation**, pas d’une valeur techniquement immuable.

En interface principale et dans le menu rapide, plusieurs indicateurs fixes peuvent être rangés en grille compacte, jusqu’à trois par ligne selon la largeur disponible.

### 7.4 `toggle` — Toggle / case

Rendu :

- pastille 48 × 48 px ;
- icône uniquement ;
- aucun chiffre ;
- aucun rail.

État :

- actif = icône en couleurs ;
- inactif = icône désaturée/assombrie.

Interaction :

- clic sur la pastille pour basculer si l’utilisateur possède le droit d’édition.

Le toggle peut partager la grille compacte trois colonnes avec les indicateurs fixes.

### 7.5 `icon` — Indicateur à icônes cumulatives

Le type historique `icon` est désormais utilisé comme indicateur de **1 à 6 unités visuelles**.

Configuration :

- valeur actuelle = nombre d’icônes actives ;
- max = nombre total d’icônes à afficher ;
- maximum actuel : 6.

Rendu :

- même asset répété ;
- icône active = couleur ;
- icône inactive = désaturée.

Comportement cumulatif :

- cliquer une icône inactive active toutes les unités jusqu’à cette position ;
- cliquer une icône déjà active la désactive ainsi que toutes celles qui suivent.

Exemple :

```text
2/6, clic sur la 5e -> 5/6
5/6, clic sur la 3e -> 2/6
```

Pas de drag.

`Afficher sur le token` reste disponible pour ce type.

## 8. Administration dans l’interface principale

Pour le MJ, les cartes de tracker possèdent un menu `…` qui regroupe les actions secondaires :

- Afficher/Masquer sur le token
- Modifier
- Supprimer

L’objectif est d’éviter les grandes rangées de boutons sous chaque tracker.

Les trackers `readonly` et `toggle` peuvent être disposés en grille trois colonnes afin de réduire la hauteur du panneau.

## 9. Presets

Les presets existent pour les types de tokens.

Comportement attendu :

- l’ajout d’un token peut appliquer le preset de son type ;
- `Appliquer preset` ajoute les trackers manquants ;
- ne pas écraser automatiquement les trackers existants ;
- éviter les doublons de nom ;
- le MJ peut gérer/réinitialiser les presets.

Les exemples PV/CA/munitions restent des suggestions de preset, jamais des contraintes sémantiques du renderer.

## 10. Assignation joueur

Le formulaire token utilise la liste des joueurs Owlbear connectés.

Le token conserve :

- `assignedPlayerId`
- `assignedPlayerName`

Un joueur hors ligne déjà enregistré peut rester identifiable dans le formulaire.

## 11. Permission de modification joueur

Le comportement validé actuel distingue **édition** et **visibilité d’overlay**.

### 11.1 Interface de contrôle

Pour un joueur :

```text
tracker.canPlayerEdit == true
ET token assigné à ce joueur
=> tracker visible et modifiable dans les interfaces Stats de contrôle
```

Le tracker n’a pas besoin d’être `public` pour apparaître dans ces interfaces si le MJ a explicitement autorisé sa modification.

Le MJ garde tous les droits.

### 11.2 Visibilité d’overlay

`visibility` continue de contrôler l’audience de l’affichage sur la scène :

- `gm`
- `private`
- `public`

Ne pas confondre :

```text
canPlayerEdit -> permission de contrôle
visibility    -> audience d'affichage
showOnToken   -> intention d'afficher
```

## 12. Interface principale côté joueur

Le joueur ne doit pas voir une copie simplifiée de toute l’administration MJ.

Il voit uniquement les tokens qui lui sont assignés et les trackers pour lesquels `Modification joueur autorisée` est activée.

Il peut utiliser les contrôles du renderer correspondant.

Les actions MJ restent masquées.

## 13. Sous-menu contextuel Stats

Le menu clic droit **Stats** est une interface de changement rapide.

### MJ

Le MJ peut ouvrir le menu sur un token éligible et manipuler les trackers.

### Joueur

Le menu n’est visible que si :

- le token est assigné au joueur courant ;
- au moins un tracker a `canPlayerEdit = true`.

À l’intérieur, le joueur ne voit que les trackers qu’il peut modifier.

### Règle UX

Le sous-menu rapide ne doit pas afficher les menus `…` des trackers.

Il ne doit pas permettre :

- supprimer un tracker ;
- modifier sa configuration ;
- changer `showOnToken`.

Ces opérations sont réservées à l’interface principale.

La grille contextuelle adapte les renderers à la largeur Owlbear :

- `bar`, `counter`, `icon` sur toute la largeur ;
- `readonly` et `toggle` jusqu’à trois par ligne.

## 14. Ajouter / Retirer du Stat Tracker

Le menu contextuel alterne entre :

- Ajouter au Stat Tracker
- Retirer du Stat Tracker

selon le flag `tracked`.

Cette action est MJ uniquement.

Elle doit fonctionner via le background permanent, même si l’addon principal n’a jamais été ouvert dans la session.

## 15. Conditions — architecture fonctionnelle

Conditions et trackers sont indépendants.

La gestion principale des conditions a été retirée de la fiche Stats pour devenir une interaction contextuelle proche du token.

### 15.1 Sous-menu Conditions

Le menu clic droit Conditions :

- est enregistré par le background ;
- est disponible sur les tokens éligibles ;
- est actuellement MJ uniquement ;
- utilise un champ de recherche ;
- utilise une liste compacte à une colonne adaptée à la largeur native OBR ;
- utilise des icônes logiques dédiées.

### 15.2 Activation

Cliquer une condition inactive ouvre une petite fenêtre de configuration.

Selon la condition, elle peut demander :

- niveau/valeur ;
- durée ;
- visibilité.

Une condition active peut être désactivée depuis la liste.

L’édition avancée d’une condition déjà active via un geste secondaire n’est pas documentée comme un comportement stable à ce checkpoint ; ne pas l’inventer.

### 15.3 Affichage de la liste

Lorsqu’un niveau existe, le nom peut être présenté sous forme :

```text
Blessé +2
```

La zone secondaire est réservée à la durée lorsqu’elle n’est pas manuelle :

```text
Rencontre
Repos
3 rounds
```

## 16. Durées et Initiative

Types de durée :

- Manuelle
- Rounds
- Rencontre
- Repos

`Rounds` et `Rencontre` dépendent d’une participation/rencontre Initiative exploitable.

Le menu doit désactiver ou rendre indisponibles ces choix lorsque le token ne peut pas être rattaché à la feuille d’initiative.

Pour les rounds, Stats conserve des informations d’ancrage telles que :

- encounter id ;
- round de départ ;
- round d’expiration ;
- rounds restants.

Le background synchronise l’évolution avec Initiative.

Cette intégration est ciblée : elle n’autorise pas d’autres automatismes de combat sans chantier explicite.

## 17. Affichage des conditions sur token

L’ancien système de grands anneaux a été abandonné.

L’affichage actuel repose sur des petites icônes/badges de condition disposés autour du token suivant une logique radiale/invisible.

Objectifs :

- plusieurs conditions simultanées ;
- icône reconnaissable ;
- niveau visible quand nécessaire ;
- informations de durée accessibles sans alourdir le token ;
- audience respectant la visibilité.

Le système utilise les assets de conditions et l’intégration Overlay Effect/Owlbear.

## 18. Overlays trackers

Les étapes V2.5 historiques ont préparé successivement :

- modèle d’affichage ;
- dry-run ;
- plan de rendu ;
- SVG local ;
- adaptateur Owlbear ;
- rendu réel et visibilité.

L’état courant est allé plus loin : une synchronisation automatique des overlays trackers existe côté MJ lorsque la page Stats est active et la scène prête.

Les mises à jour depuis les métadonnées doivent rester cohérentes avec les copies de tokens et les audiences.

Point de vigilance : les changements effectués depuis l’interface rapide d’un joueur écrivent le profil embarqué mais ne déclenchent pas directement l’écrivain d’overlay MJ dans ce composant. La propagation visuelle immédiate doit être testée en situation multi-client ; ne pas supposer une synchronisation instantanée parfaite sans test terrain.

## 19. Bibliothèque de conditions et effets

Les définitions peuvent porter des effets descriptifs :

- CA ;
- jets ;
- perception ;
- vitesse ;
- actions ;
- visibilité ;
- initiative ;
- etc.

Modes préparés :

- bonus/malus de statut ;
- bonus/malus de circonstance ;
- set ;
- disable ;
- information.

Ces effets restent **descriptifs/préparatoires** tant qu’aucun module mécanique n’est explicitement branché.

## 20. Découpage historique Stats V2

### V2.1 — Trackers personnalisables

Implémenté.

### V2.2 — Types et presets

Implémenté, avec presets internes et gestion MJ.

### V2.3 — Assignation joueur

Implémenté et étendu :

- assignation via joueurs Owlbear ;
- filtrage réel ;
- permission d’édition ;
- menu rapide joueur conditionnel.

### V2.4 — Conditions

Implémenté puis fortement refondu :

- catalogue ;
- niveaux ;
- durées ;
- effets descriptifs ;
- conditions indépendantes du Stat Tracker ;
- menu contextuel permanent ;
- affichage sur token ;
- synchronisation de certaines durées avec Initiative.

### V2.5 — Affichage sur token

Implémenté au-delà de la préparation initiale :

- overlays réels ;
- audience ;
- synchronisation automatique des trackers dans le contexte MJ ;
- badges de conditions ;
- prise en charge des instances/copies de scène.

## 21. Non-objectifs actuels

Ne pas ajouter sans demande explicite :

- fiche complète PF2e ;
- calcul automatique de CA/attaques/saves ;
- moteur de dégâts ;
- automatisation complète des effets de conditions ;
- intégration Calendar ;
- intégration Loot Table ;
- déduction du sens d’un tracker à partir de son nom ou de son icône ;
- plusieurs sons ou effets permanents par tracker.

## 22. Audio Stats

Une spécification audio existe dans :

```text
docs/stats/STAT_AUDIO_FEEDBACK_V1.md
```

Elle prévoit un son signature par icône.

Aucun service runtime audio (`playStatIconSound`, registry audio, etc.) n’a été identifié dans le code courant lors du checkpoint. L’audio doit donc être documenté comme **prévu**, pas comme implémenté.

## 23. Accessibilité et confort

Les contrôles doivent :

- conserver un feedback visuel sans dépendre de l’audio ;
- supporter le clavier lorsque raisonnable ;
- ne pas utiliser des animations permanentes ;
- respecter `prefers-reduced-motion` ;
- garder des tailles lisibles dans le popover et les sous-menus ;
- conserver les scrollbars intégrées au thème.

## 24. Critères de stabilité avant nouvelle grosse étape

Avant d’ouvrir un chantier Stats supplémentaire :

1. typecheck vert ;
2. build vert ;
3. test MJ du panneau Stats ;
4. test clic droit Stats sans ouvrir l’addon ;
5. test Conditions sans token suivi ;
6. test copie de token ;
7. test retrait/réajout avec restauration ;
8. test joueur assigné avec un seul tracker modifiable ;
9. test audience des overlays ;
10. test durée Rounds/Rencontre avec Initiative ;
11. test multi-scène et suppression de la dernière copie pour clarifier le nettoyage global.

## 25. Règle de compatibilité interne

Les données doivent rester exploitables par les autres modules via des services explicites.

Une intégration future doit utiliser les identifiants et valeurs structurés, et non chercher des mots comme « PV » dans le nom d’un tracker ou supposer qu’un cœur signifie des points de vie.
