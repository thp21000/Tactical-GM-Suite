# PROJECT_CONTEXT

> Document de contexte opérationnel — Tactical GM Suite  
> Dernière remise à niveau : **4 septembre 2026**.

Ce fichier décrit l’état réel du produit, les décisions stabilisées, les frontières d’architecture, les points ouverts et l’historique suffisamment détaillé pour reprendre le projet sans reconstruire le contexte depuis les conversations précédentes.

---

## Projet

**Nom :** Tactical GM Suite  
**Type :** extension modulaire Owlbear Rodeo  
**Dépôt :** `thp21000/Tactical-GM-Suite`

### Objectif

Regrouper dans une même extension plusieurs outils tactiques pour MJ tout en gardant les modules autonomes, lisibles et maintenables.

Le projet ne cherche pas à reproduire un VTT complet ni une fiche de personnage automatisée. Il doit surtout réduire les manipulations du MJ pendant la partie.

### Modules actifs

1. Core / Dashboard
2. Initiative Tracker
3. Distance / Déplacement / Portée
4. Stat Tracker / Conditions

### Modules reportés

5. Calendar
6. Loot Table

Calendar et Loot Table restent hors scope tant qu’un chantier explicite ne les ouvre pas.

---

## URLs importantes

### Dépôt

```text
https://github.com/thp21000/Tactical-GM-Suite
```

### GitHub Pages

```text
https://thp21000.github.io/Tactical-GM-Suite/
```

### Manifest Owlbear

```text
https://thp21000.github.io/Tactical-GM-Suite/manifest.json
```

---

## Stack

- React
- TypeScript
- Vite
- Owlbear Rodeo SDK
- lucide-react
- CSS local
- GitHub Pages
- GitHub Actions

Commandes courantes :

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

---

## Versions observées au checkpoint

Le versioning n’est toujours pas harmonisé.

```text
package.json          0.1.0
public/manifest.json  0.2.38
jalons Git            jusqu’à au moins "Version 0.3.10"
```

Le head observé avant ce checkpoint documentaire était `bed593839c8dcb9851791499be233954693c7e1a`, nommé `Version 0.3.10`.

Important : un nom de commit n’est pas une preuve de version publique. Ne pas annoncer automatiquement `0.3.10` comme version publiée tant que `package.json`, `manifest.json` et la stratégie de release n’ont pas été alignés explicitement.

---

# Décisions produit validées

## Modularité

Le projet reste structuré autour de :

```text
src/core/
src/features/
src/shared/
src/i18n/
```

Règles :

- ne pas déplacer la logique métier dans `App.tsx` ;
- ne pas créer un dossier `utils` générique ;
- ne pas mélanger Initiative, Range, Trackers et Conditions dans un même moteur ;
- une intégration inter-module doit être volontaire, petite et documentée ;
- Calendar/Loot restent hors scope sans demande explicite.

## Langue et système de jeu

Depuis le 3 septembre 2026, Tactical GM Suite possède deux préférences globales dans le Core :

```text
language   = fr | en
gameSystem = DND5E | PF2E | GENERIC
```

Préférences par défaut :

```text
language   = fr
gameSystem = PF2E
```

Décisions :

- sélecteur de langue avec drapeau ;
- système actif avec indicateur visuel explicite ;
- traduction rétroactive progressive, pas de refonte globale immédiate ;
- toute nouvelle chaîne ou chaîne modifiée doit maintenant être fournie simultanément en FR et EN ;
- les modules n’utilisent le système que s’ils en ont besoin ;
- Conditions consomme déjà `gameSystem` ;
- le futur Loot Table devra réutiliser ces préférences, pas créer son propre réglage global.

## UI

La direction visuelle globale reste fortement intégrée au design Owlbear :

- thème sombre/glass ;
- couleurs dérivées du thème OBR ;
- Overlay Effect ;
- scrollbars intégrées ;
- sous-menus proches du comportement natif Owlbear ;
- interfaces contextuelles compactes ;
- états actifs lisibles sans dépendre uniquement de la couleur.

---

# État actuel par module

## Core / Dashboard

Le Core fournit :

- shell principal ;
- navigation ;
- registre de modules ;
- disponibilité Owlbear ;
- thème ;
- préférences globales langue/système ;
- provider partagé entre popover et embeds ;
- panneaux de synthèse Dashboard.

La synthèse Stats reste sur le Dashboard afin de ne pas surcharger la page Stats.

## Initiative Tracker

État fonctionnel :

- participants ;
- ordre ;
- tours ;
- rounds ;
- actifs/inactifs ;
- vaincus ;
- import Owlbear ;
- stockage partagé adapté à la room.

Intégration autorisée avec Conditions :

- disponibilité des durées `Rounds` / `Rencontre` ;
- synchronisation des rounds et de la fin de rencontre.

Aucune automatisation générale de combat n’en découle.

## Distance / Déplacement / Portée

État V1 :

- origine/cibles ;
- mesure ;
- lecture de grille ;
- presets ;
- préférences.

Pas de dépendance active avec Stats/Conditions au checkpoint.

## Stat Tracker

Stats possède maintenant une couche runtime Owlbear mature :

- profils embarqués ;
- copies/instances de scène ;
- presets ;
- assignation joueur ;
- permissions ;
- cinq renderers ;
- menus contextuels permanents ;
- overlays trackers ;
- Conditions contextuelles séparées ;
- background permanent.

---

# Stats — décisions fonctionnelles stabilisées

## Trackers libres

Le système ne doit jamais déduire une stat de son icône.

```text
heart != obligatoirement HP
shield != obligatoirement AC
coin != obligatoirement monnaie
```

Le modèle doit seulement connaître :

```text
nom
type visuel
valeur(s)
icône
permissions
visibilité
affichage
```

## Style/skin supprimé

`skinId` n’est plus un choix UI actif.

Le rendu dépend du renderer, de l’accent déclaré de l’icône et du thème Owlbear.

## Bibliothèque Trackers

Quatre catégories :

- Corps & Protection
- Arcane & Combat
- Ressources & Richesses
- Objets & Marques

Base documentée : 48 icônes.  
Ajouts documentés : 15.  
Total documenté : 63 identifiants.

Les accents sont déclarés manuellement.

## Cinq renderers

### `bar` — Barre à valeur max

- current/max ;
- icône à gauche ;
- valeur centrale ;
- drag horizontal ;
- inline math ;
- borne 0..max ;
- texture liquide/organique ;
- bulles pseudo-aléatoires ;
- désaturation progressive de l’icône.

### `counter` — Indicateur modifiable

- orbe 48 px ;
- `-5`, `-1`, `+1`, `+5` ;
- négatifs autorisés ;
- pas de min/max ;
- pas de drag ;
- inline math.

### `readonly` — Indicateur fixe

Nom technique historique.

- orbe 48 px ;
- pas de rail ;
- pas de +/- ;
- valeur toujours éditable ;
- jusqu’à trois par ligne.

### `toggle`

- orbe 48 px ;
- aucun chiffre ;
- couleur = actif ;
- désaturé = inactif ;
- jusqu’à trois par ligne.

### `icon`

- 1 à 6 unités ;
- current = unités actives ;
- clic cumulatif.

## Inline math

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

# Stats — persistance

## Source durable

Les profils sont écrits dans les métadonnées du token Owlbear.

Le profil inclut notamment :

- trackers ;
- conditions ;
- assignation joueur ;
- type ;
- groupe ;
- notes ;
- timestamps ;
- état tracked.

## Retrait sans perte

`Retirer du Stat Tracker` change l’état de suivi mais conserve le profil.

Réajouter le token doit restaurer la configuration.

## Copies

Le modèle distingue :

- ID canonique ;
- `sourceItemId` ;
- instances de scène ;
- copies liées.

Les copies ne doivent pas devenir des profils indépendants incohérents.

## Point ouvert : garbage collection globale

Les métadonnées disparaissent avec l’item supprimé, mais aucune garantie documentaire complète n’a encore clos le cas d’une éventuelle référence canonique centrale après suppression de la dernière copie dans toutes les scènes.

---

# Conditions — état stabilisé au 4 septembre 2026

## Catalogue canonique

Le catalogue runtime est désormais :

```text
src/features/stats/services/statConditionCatalog.ts
```

Contenu :

```text
DND5E   -> 15 conditions D&D 5e 2014
PF2E    -> 42 conditions PF2e Remaster
GENERIC -> 0 condition actuellement
```

Le catalogue maître contient 46 concepts canoniques, dont 11 communs aux deux systèmes.

Un concept partagé garde le même ID visuel/canonique, mais ses règles restent spécifiques au système.

## Suppression du legacy

L’ancien `statConditions.ts` et les anciennes définitions/aliases de migration ont été supprimés du runtime.

Décision produit : aucune transition n’est nécessaire à ce stade car l’addon n’est pas encore distribué à un parc externe à migrer.

## Conditions indépendantes du suivi Stats

Un token peut avoir des conditions sans être ajouté au Stat Tracker.

Un profil dormant condition-only peut exister avec :

```text
isTracked = false
trackers = []
```

## Menu Conditions

Flux principal :

```text
clic droit token
→ Conditions
→ recherche / liste
→ activation, désactivation ou édition
```

État actuel :

- MJ uniquement ;
- langue FR/EN globale ;
- système global D&D5e/PF2e/Générique ;
- liste triée alphabétiquement selon le libellé traduit ;
- plusieurs conditions actives simultanément ;
- condition active désactivable ;
- condition active modifiable par son action d’édition ;
- niveau/valeur, durée et visibilité gérés sans modifier les autres conditions.

## Hover

Au survol d’une condition :

- carte ancrée à la ligne survolée ;
- affichage directement au-dessus lorsque possible ;
- fallback sous la ligne si l’espace manque en haut ;
- **Description** ;
- **Résumé règles** du système sélectionné ;
- contenu dans la langue active.

## Durées

- Manuelle
- Rounds
- Rencontre
- Repos

Rounds/Rencontre dépendent de l’état Initiative exploitable.

## Effets mécaniques

Les résumés de règles sont informatifs. Tactical GM Suite n’applique pas automatiquement toutes les conséquences mécaniques D&D/PF2e.

---

# Conditions — affichage sur token

## Séparation stricte avec Stats

Invariants :

```text
Stats      -> token.trackers   -> overlay Stats
Conditions -> token.conditions -> badges Conditions
```

Les deux systèmes ont :

- leurs propres métadonnées Owlbear ;
- leurs propres services de synchronisation ;
- leurs propres triggers.

Une modification Conditions ne doit jamais faire réapparaître l’affichage Stats.

`useStatTokenOverlayAutoSync` ne doit réagir qu’aux trackers.

Conditions possède son propre auto-sync dans le background.

## Préchargement PNG

Le background lance le préchargement dès `OBR.onReady` :

1. PNG Conditions canoniques ;
2. PNG Trackers ;
3. concurrence limitée à 4.

But : chauffer le cache navigateur avant le premier sous-menu/overlay.

## Géométrie actuelle

Valeurs finales du checkpoint :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

La couronne possède une correction visuelle légère vers la gauche et le haut.

## Resize proportionnel

Formule :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Donc un token ×2 produit des badges ×2 ; un token ×0,5 produit des badges ×0,5.

Le rayon et l’espacement utilisent la même échelle.

## Niveau sur token

Le chiffre de niveau/valeur n’est plus rendu sur la scène.

Le niveau reste consultable et modifiable dans le menu Conditions.

Le runtime peut encore reconnaître un ancien rôle metadata `level` uniquement pour supprimer des labels obsolètes lors d’un sync.

---

# Menus contextuels permanents

Le background Owlbear reste actif sans ouverture du popover principal.

Tokens autorisés : images sur `CHARACTER`, `MOUNT`, `PROP`.

## Ajouter/Retirer du Stat Tracker

MJ uniquement.

## Conditions

MJ uniquement au checkpoint.

## Stats rapide

### MJ

Tous les trackers du token.

### Joueur

Uniquement si :

- token assigné au joueur ;
- au moins un tracker `canPlayerEdit = true`.

À l’intérieur, seulement les trackers modifiables sont rendus.

Aucune administration (`Modifier`, `Supprimer`, `Afficher sur token`) dans le menu rapide.

---

# Permissions joueur

Séparer impérativement :

```text
canPlayerEdit
visibility
showOnToken
```

`canPlayerEdit` = permission de contrôle.  
`visibility` = audience de scène.  
`showOnToken` = intention d’affichage.

---

# Documentation de référence

Ordre recommandé :

1. `PROJECT_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/LOCALIZATION_AND_SYSTEMS.md`
4. `docs/features/STATS_V2_SPEC.md`
5. `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`
6. `docs/stats/CONDITIONS_RUNTIME_SYNC.md`
7. `docs/stats/README.md`
8. `src/features/stats/README.md`

Pour l’audio prévu :

- `docs/stats/STAT_AUDIO_FEEDBACK_V1.md`

Le code courant reste la référence finale pour l’implémentation réelle.

---

# Points ouverts / dette connue

## Technique

- vérifier le nettoyage global après suppression de la dernière copie d’un profil dans toutes les scènes ;
- tester la propagation instantanée d’une modification joueur vers les overlays multi-clients ;
- harmoniser le versioning package/manifest/jalons Git ;
- continuer les tests Context Menus après refresh/changement de scène ;
- documenter une vraie migration si `STAT_TOKEN_PROFILE_VERSION` évolue.

## Conditions

- tester les tailles extrêmes de token et le resize répété ;
- tester >12 conditions pour le second anneau ;
- tester toutes les audiences multi-client ;
- tester changement FR/EN et D&D5e/PF2e en room ;
- décider ultérieurement du contenu Générique ;
- D&D 2024 reste hors scope.

## UX Stats

- poursuivre le polissage sur vraies rooms ;
- vérifier les largeurs extrêmes du menu Stats rapide ;
- clarifier à long terme le nom technique `readonly`.

## Futur

- audio Stats ;
- effets mécaniques uniquement via chantier dédié ;
- Calendar ;
- Loot Table.

---

# Journal de session / historique détaillé

Cette section est volontairement détaillée. Elle doit permettre à une future session de comprendre non seulement ce qui existe, mais **comment et pourquoi** l’état actuel a été atteint.

## 22 juin 2026 — fondation de la suite

### Core / Dashboard

- création de la base Core/Dashboard V1 (`d7d4ffef...`) ;
- stabilisation du Dashboard (`9f879ca5...`) ;
- validation de l’architecture modulaire `core/features/shared`.

### Initiative Tracker

- ajout Initiative Tracker V1 (`6d4dd13c...`) ;
- gestion ordre/rounds/tours ;
- comportement ultérieur pour participants inactifs/vaincus (`bff78887...`).

### Distance / Range

- ajout Range Measurement V1 (`9e883d9c...`).

### Stats V1

- ajout du premier Stat Tracker (`b4373745...`).

Décision durable : les quatre outils tactiques principaux doivent être stabilisés avant Calendar/Loot.

## 23 juin 2026 — Stats V2.1

- migration vers des trackers personnalisables (`3dda9b98...`) ;
- modèle token + trackers ;
- helpers labels Stats V2 (`e55211e1...`) ;
- corrections Context Menu/paths Pages (`1272be23...`).

Décision : les trackers deviennent des objets génériques, pas des champs PV/CA codés en dur.

## 24–25 juin 2026 — presets, assignation et permissions préparées

- types de token ;
- presets ;
- assignation joueur ;
- préparation permissions (`d2ae2fe5...`) ;
- filtrage viewer (`7abe2bb7...`).

## 25 juin 2026 — Conditions V2.4A/B

- premier catalogue/assignation (`f5eb9102...`) ;
- durée et édition simple (`e192de72...`).

Les conditions sont séparées des trackers dès cette phase.

## 29 juin 2026 — effets et pipeline overlay

- effets descriptifs (`878756d0...`) ;
- métadonnées affichage token (`e88a3acc...`) ;
- modèle aperçu (`e021765d...`) ;
- dry-run (`2ecf3196...`) ;
- plan rendu (`dd21ff98...`) ;
- aperçu SVG (`368104d9...`) ;
- adaptateur Owlbear (`a22ae6e9...`).

## 30 août 2026 — Stats V2.5F devient réel

### Overlays/audiences

- visibilité conditions (`817c284a...`) ;
- overlays audience-aware (`302c5802...`) ;
- rendu réel (`20f13e06...`) ;
- normalisation visibilité (`a418ba0e...`) ;
- persistance condition (`ec56dba9...`).

### Synchronisation automatique

- auto-sync overlays Stats (`1a7d2bdb...`, `7458bf1e...`).

### Copies/scènes

- liens scene-aware (`4a6e4ecf...`) ;
- instances par scène (`0a110c22...`) ;
- prévention doublons (`612e5a7e...`) ;
- sync instances (`cd821dfd...`) ;
- liste scène courante (`b3e664bc...`) ;
- plusieurs instances (`a1e9b24c...`).

## 31 août 2026 — assets Conditions et Dashboard

- resolver images Conditions (`b87c1846...`) ;
- alignement assets (`8446639d...`) ;
- ajustements overlays ;
- synthèse Stats Dashboard (`d7258e2b...`) ;
- déplacement vers Dashboard (`d744ae14...`) ;
- suppression overview page Stats (`b0a3b2a0...`).

Décision UX : page Stats = travail du token ; Dashboard = synthèse.

## 2 septembre 2026 — session majeure de refonte Stats

### A. Modale tracker et bibliothèque PNG

- modernisation modale (`efc01f0a...`) ;
- bibliothèque PNG par catégories ;
- corrections registre TypeScript (`01baa74c...`) ;
- suppression du style/skin actif ;
- accent dérivé de l’icône.

### B. Profils persistants

- persistance profils liés (`354cb367...`) ;
- retrait sans perte (`7e0c6103...`) ;
- stockage durable token Owlbear (`405832f3...`) ;
- hydratation Dashboard (`c816fd32...`).

### C. Conditions déplacées vers le clic droit

- retrait ancien éditeur de la fiche Stats (`38858278...` et suivants) ;
- IDs/menu Conditions (`90ace840...`, `e338a2ee...`) ;
- sous-menu (`14cf699b...`) ;
- badges radiaux à la place des grands anneaux (`bd8aeeaa...`).

### D. Background permanent

Entrypoint background consolidé jusqu’au merge `49bcf579...`.

Résultat : menus/Conditions fonctionnent sans ouverture préalable du popover.

### E. Conditions sans suivi Stats

- profil condition-only (`72052991...`) ;
- ouverture sur tout token compatible (`9688cc7e...`) ;
- affichage indépendant (`776ccb77...`) ;
- conservation hors Stat Tracker (`eb270b5b...`) ;
- merge `50779812...`.

### F. Intégration visuelle OBR

- thème/largeur native/custom selects ;
- couche UI globale OBR (`718b9b7e...`) ;
- merge `3d980a5d...`.

### G. Durées Conditions ↔ Initiative

- sync Initiative (`94c62174...`) ;
- rounds/rencontre (`af0d5ee9...`) ;
- affichage compact (`a83615a9...`) ;
- options indisponibles explicites (`b6a4d1b1...`) ;
- consolidation `25a73925...`.

### H. Refonte renderers

Barre (`898419cb...` puis nombreuses passes), Counter (`3e866777...`), Fixed (`03019445...`), Toggle (`cc1ef32a...`) et Icon cumulatif (`850a0249...`) sont progressivement stabilisés.

Décisions finales :

- bar draggable + inline math ;
- counter non borné avec -5/-1/+1/+5 ;
- readonly éditable malgré son nom ;
- toggle sans chiffre ;
- icon cumulatif 1–6.

### I. Menu Stats rapide et permissions réelles

- menu Stats contextuel (`159ff8b4...`, `3acc05e9...`, `c024b385...`) ;
- `canPlayerEdit` réellement appliqué (`c6af4180...`) ;
- filtrage viewer (`babb8e44...`) ;
- résumé metadata (`71b47fbb...`, `b8ea116c...`) ;
- menu joueurs autorisés (`fc915507...`) ;
- contrôles autorisés uniquement (`7f4588a5...`) ;
- actions admin retirées (`d7f03f4f...`).

Règle finale :

```text
joueur assigné + canPlayerEdit
=> tracker visible/modifiable dans les interfaces de contrôle
```

### J. Jalon

- commit `60d5b0b9...` nommé `Version 0.3.00` ;
- divergence avec package/manifest déjà connue.

## 3–4 septembre 2026 — i18n, systèmes et refonte Conditions canonique

Cette session est structurante pour la suite du projet : elle pose les fondations globales de langue/système et remplace le vieux moteur Conditions par un catalogue canonique multi-système.

### A. Fondation langue + système — PR #12

PR #12, merge squash :

```text
4614ae5c14e40b8b9e313b14d1ce28683e7f6fe4
```

Travail réalisé :

- préférences globales `fr/en` ;
- préférences globales `DND5E/PF2E/GENERIC` ;
- provider partagé entre popover principal et embeds Owlbear ;
- persistance locale + synchronisation via `storage` ;
- fichiers i18n préparés par module ;
- règle de développement : tout nouveau texte/modification doit exister en FR et EN ;
- Conditions branché sur le système global ;
- 15 conditions D&D 5e 2014 ;
- 42 conditions PF2e Remaster ;
- entrée Générique conservée mais catalogue vide.

Décision importante : le système est une préférence du Core et non une préférence de Conditions. Le futur Loot Table devra lire la même valeur.

### B. Sélecteurs visuels Paramètres

Après la fondation :

- drapeau ajouté au choix de langue ;
- système actif doté d’un indicateur visuel explicite ;
- l’état sélectionné ne repose plus uniquement sur une variation de couleur/fond.

### C. Catalogue canonique et suppression du legacy — PR #13

PR #13, merge squash :

```text
1bc327e6465fcb499b02ae3ff26ee4cc6e7be7ad
```

Changements :

- migration du runtime vers les IDs canoniques ;
- utilisation des nouveaux PNG `assets/condition/Icon/` ;
- suppression physique de l’ancien `statConditions.ts` ;
- suppression des aliases français et des anciennes entrées hors catalogue ;
- suppression de la logique historique de migration ;
- nettoyage des derniers imports vers l’ancien service ;
- la page Stats n’administre plus les Conditions ;
- les anciennes conditions `Mort`, `Marque du chasseur`, etc. ne font plus partie du runtime canonique.

Décision : pas de transition legacy car seul le développeur utilise encore cette version de l’addon.

### D. Plusieurs Conditions simultanées sécurisées

Pendant la suppression du legacy, vérification explicite de la logique d’upsert :

```text
ajouter A
puis ajouter B
=> A et B restent actives
```

Modifier une condition ne touche qu’à celle-ci.

Une condition active reste visible dans le menu ; elle peut être désactivée ou modifiée individuellement.

C’est désormais un invariant du produit.

### E. Hover Description / Résumé règles

Le menu Conditions a été enrichi :

- descriptions FR/EN ;
- résumés de règles FR/EN ;
- résumé spécifique au système actuellement sélectionné ;
- aucune fusion mécanique entre D&D et PF2e même pour les IDs communs.

Puis le hover a été repositionné pour apparaître directement au-dessus de la ligne survolée, avec fallback sous la ligne lorsque le haut de la fenêtre ne laisse pas assez d’espace.

PR #15, merge :

```text
858effdf94d611bfa44ae7e3d54f35c33fe7d96f
```

### F. Préchargement PNG et séparation stricte Stats/Conditions — PR #14

PR #14, merge :

```text
feec489f92ae7b2d76a99771c18e6b7bf5b470a8
```

Problème observé : cliquer sur une condition pouvait faire réapparaître l’affichage Stats au-dessus du token.

Cause : l’ancien auto-sync Stats réagissait trop largement à des changements de profil/token.

Correction :

- `useStatTokenOverlayAutoSync` recentré uniquement sur les trackers ;
- Conditions possède désormais son propre auto-sync ;
- une action Conditions ne peut plus appeler indirectement l’écrivain Stats ;
- resize Conditions géré dans le background permanent.

En parallèle :

- préchargement des PNG dès `OBR.onReady` ;
- Conditions en priorité ;
- Trackers ensuite ;
- concurrence limitée à 4 ;
- aucune attente bloquante avant l’enregistrement des menus.

Décision architecturale majeure :

```text
Stats      -> moteur overlay Stats
Conditions -> moteur overlay Conditions
```

Ils peuvent partager le profil de données embarqué, mais pas leur logique de rendu/synchronisation.

### G. Taille et géométrie des badges — PR #14 à #17

Plusieurs passes visuelles ont été faites à partir de captures en room.

Évolution :

- réduction initiale forte ;
- +10 % ;
- +30 % supplémentaire ;
- recentrage ;
- élargissement de la couronne ;
- correction visuelle vers le haut/gauche.

PR #16, merge :

```text
95d503898ec9db24b840ca0aa092f704529a11b2
```

Cette passe a aussi supprimé totalement les chiffres de niveau sur les badges de scène.

PR #17, merge :

```text
45f6c8a9ed35462709c26eaf22db7c12ea9fb697
```

Valeurs de correction actuellement retenues :

```text
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
MAX_BADGES_PER_RING = 12
```

### H. Tri alphabétique des Conditions — PR #17

La liste du menu est maintenant triée par le libellé traduit :

```text
langue FR -> ordre alphabétique français
langue EN -> ordre alphabétique anglais
```

Le premier CI de cette PR a remonté un problème TypeScript sur le typage de `category`; il a été corrigé avant merge. Typecheck/build finaux verts.

Important : ce tri concerne le menu. L’ordre radial sur token reste stable selon création/ID afin d’éviter que changer de langue déplace toute la couronne.

### I. Resize proportionnel — PR #18

Problème observé : lors d’un changement de taille du token, la couronne suivait le rayon mais les icônes ne conservaient pas la même proportion visuelle.

PR #18, merge :

```text
77026e6d19619d79bf2a6a0f9a0b54f42c162cf6
```

Nouvelle formule :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Donc :

```text
0,5 case -> badge ×0,5
1 case   -> taille de référence
2 cases  -> badge ×2
```

Le diamètre utilisé pour le rayon/espacement reprend la même échelle dynamique.

### J. Agrandissements finaux directs sur `main`

Après validation du comportement proportionnel, deux ajustements visuels ont été appliqués directement sur `main` :

1. `3403f8c9d2914be94ac0770005a5c1c6d4dcddc9`
   - `0.1144 -> 0.1716` ;
   - +50 %.

2. `7baacc714c8479109f81d6db870862583f01ee22`
   - `0.1716 -> 0.2574` ;
   - encore +50 %.

Taille de référence finale du checkpoint :

```text
BASE_BADGE_SCALE = 0.2574
```

Cette valeur reste multipliée par le facteur de taille du token.

### K. État final Conditions de la session

Le sous-système Conditions possède désormais les invariants suivants :

- catalogue canonique uniquement ;
- D&D5e/PF2e réellement filtrés ;
- Générique prévu mais vide ;
- langue FR/EN ;
- descriptions/résumés localisés ;
- hover ancré à la ligne ;
- liste alphabétique selon la langue ;
- plusieurs conditions simultanées ;
- édition ciblée ;
- aucune migration legacy ;
- assets PNG canoniques ;
- préchargement au démarrage ;
- aucun chiffre de niveau sur le token ;
- couronne légèrement haut-gauche ;
- resize proportionnel ;
- overlay Conditions totalement séparé de l’overlay Stats.

### L. Validation et jalon observé

Les PR de cette session ont été mergées uniquement après passage du typecheck/build correspondant.

Un commit ultérieur du dépôt porte le jalon :

```text
bed593839c8dcb9851791499be233954693c7e1a
Version 0.3.10
```

Ce nom de commit ne résout pas la divergence :

```text
package.json         0.1.0
manifest.json        0.2.38
```

Le chantier de versioning reste donc ouvert.

---

# Prochaine reprise recommandée

Avant une nouvelle grosse feature, effectuer une passe terrain ciblée :

1. Conditions sur token 0,5 / 1 / 2 / 3 cases ;
2. plusieurs resize successifs dans les deux sens ;
3. 1, 2, 4, 8, 12 et >12 conditions ;
4. vérifier position/couronne après déplacement + resize ;
5. vérifier que le niveau n’apparaît jamais sur le token ;
6. passage FR ↔ EN et vérification du tri/hover ;
7. passage PF2e ↔ D&D5e ↔ Générique ;
8. plusieurs conditions simultanées + édition/désactivation ;
9. vérifier qu’une action Conditions ne réactive jamais Stats ;
10. audiences `public/private/gm` en multi-client ;
11. Rounds/Rencontre avec Initiative ;
12. refresh sans ouverture du popover ;
13. changement de scène ;
14. copie et retrait/réajout de token ;
15. propagation joueur des trackers Stats ;
16. suppression de la dernière copie et garbage collection ;
17. harmonisation du versioning package/manifest/release.

Après cette passe, les chantiers logiques possibles sont :

- traduction progressive du reste de l’interface ;
- contenu Générique des Conditions si nécessaire ;
- stabilisation Stats supplémentaire ;
- audio ;
- approfondissement Initiative/Range ;
- ouverture de Calendar ;
- ouverture de Loot Table en réutilisant langue + système globaux.
