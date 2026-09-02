# PROJECT_CONTEXT

> Document de contexte opérationnel — Tactical GM Suite  
> Dernière remise à niveau : **2 septembre 2026**.

Ce fichier reprend l’idée du `PROJECT_CONTEXT.md` de Calendar-OBR, adaptée à Tactical GM Suite : état réel du produit, architecture utile, décisions déjà validées, points ouverts et journal de développement suffisamment détaillé pour reprendre le projet sans reconstruire le contexte depuis l’historique complet.

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
4. Stat Tracker

### Modules reportés

5. Calendar
6. Loot Table

Calendar et Loot Table existent comme projets ou fonctions séparées et ne doivent pas être intégrés implicitement.

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

Les versions déclarées dans les fichiers du dépôt ne sont pas actuellement alignées avec le nom du dernier jalon Git.

```text
package.json          0.1.0
public/manifest.json  0.2.38
commit Git            "Version 0.3.00"
```

Le commit `60d5b0b9f0a169619ea44061b055f3ed6c2ce04f` est nommé `Version 0.3.00`, puis a été fusionné dans `main` avec les derniers changements Stats.

Ne pas annoncer automatiquement « version 0.3.00 publiée » tant que les métadonnées de version n’ont pas été harmonisées explicitement.

---

# Décisions produit validées

## Modularité

Le projet reste structuré autour de :

```text
src/core/
src/features/
src/shared/
```

Règles :

- ne pas déplacer la logique métier dans `App.tsx` ;
- ne pas créer un dossier `utils` générique ;
- ne pas mélanger Initiative, Range et Stats dans un même service ;
- une intégration inter-module doit être volontaire et petite ;
- Calendar/Loot restent hors scope sans demande explicite.

## UI

La direction visuelle globale a évolué vers une intégration forte au design Owlbear :

- thème sombre/glass ;
- couleurs dérivées du thème OBR ;
- prise en charge de l’Overlay Effect ;
- scrollbars intégrées ;
- sous-menus proches du comportement natif Owlbear ;
- interfaces contextuelles compactes.

Le merge `3d980a5d3c1f2fb52abb9509e2d51b6bdc2fec74` a consolidé cette direction à l’échelle de l’addon.

---

# État actuel par module

## Core / Dashboard

Le Core/Dashboard V1 existe depuis juin 2026.

Il fournit :

- shell principal ;
- navigation ;
- registre de modules ;
- disponibilité Owlbear ;
- thème ;
- panneaux de synthèse.

Le Dashboard reçoit les informations transversales qui ne doivent pas encombrer les pages de feature. La synthèse Stats a été déplacée vers le Dashboard fin août 2026.

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

Une intégration réelle existe désormais avec Stats : certaines durées de conditions (`Rounds`, `Rencontre`) utilisent l’état d’Initiative.

Aucune automatisation de combat globale n’en découle.

## Distance / Déplacement / Portée

État V1 :

- choix d’origine/cibles ;
- mesure ;
- lecture de la grille ;
- presets ;
- préférences.

Pas de dépendance active avec Stats au checkpoint.

## Stat Tracker

Stats est le chantier principal actuel.

Il a dépassé le cahier des charges initial V2.5F et possède maintenant une véritable couche de runtime Owlbear : profils embarqués, background, menus contextuels permanents, overlays, permissions joueur et interface rapide.

---

# Stats — décisions fonctionnelles stabilisées

## Les trackers sont libres

La sémantique n’est pas codée dans l’icône.

Le système ne doit jamais faire :

```text
heart -> HP
shield -> AC
coin -> money
```

Il doit seulement savoir :

```text
nom choisi
renderer choisi
valeur(s)
icône choisie
permissions
visibilité
```

Les presets peuvent proposer des associations mais elles restent modifiables.

## Style/skin supprimé

L’ancien champ `skinId` n’est plus un choix UI.

Il reste seulement dans les types pour compatibilité legacy.

La couleur et l’ambiance du tracker proviennent maintenant de :

- renderer ;
- accent de l’icône ;
- thème Owlbear.

## Bibliothèque d’icônes

Quatre catégories :

- Corps & Protection
- Arcane & Combat
- Ressources & Richesses
- Objets & Marques

Base documentée : 48 icônes.

Ajouts documentés : 15.

Total d’IDs reconnus/documentés : 63.

Les PNG sont chargés dynamiquement. Les accents sont déclarés à la main, pas extraits automatiquement de l’image.

## Génération des icônes

Après de nombreux tests, le workflow de génération par lots a été abandonné : le générateur produisait des planches ou plusieurs variantes de la même icône.

Décision :

```text
1 prompt autonome
1 sujet
1 image
```

Les prompts individuels sont donc des payloads d’exécution qui ne doivent pas être pollués par des notes de version.

---

# Stats — cinq renderers actuels

## Barre à valeur max (`bar`)

- nom centré au-dessus ;
- menu `…` MJ en interface principale ;
- icône à gauche ;
- current au centre ;
- max à droite ;
- couleur issue de l’accent de l’icône ;
- remplissage sombre → clair ;
- bulles pseudo-aléatoires dont la densité augmente avec le remplissage ;
- bord organique ;
- icône progressivement désaturée vers 0 ;
- drag horizontal ;
- édition directe ;
- inline math ;
- borne 0..max ;
- support clavier flèches/Home/End.

## Indicateur modifiable (`counter`)

- rail décoratif ;
- pastille centrale 48 px ;
- icône + valeur ;
- `-5`, `-1`, `+1`, `+5` ;
- valeurs négatives acceptées ;
- pas de min/max ;
- pas de drag ;
- inline math.

## Indicateur fixe (`readonly`)

Le nom technique est legacy.

- pastille 48 px ;
- icône + valeur ;
- aucun rail ;
- aucun bouton +/- ;
- valeur modifiable par clic/inline math ;
- jusqu’à 3 par ligne.

## Toggle (`toggle`)

- pastille 48 px ;
- aucune valeur ;
- clic sur l’icône ;
- actif = couleurs ;
- inactif = désaturé ;
- jusqu’à 3 par ligne.

## Indicateur à icônes (`icon`)

Le type `icon` a évolué vers un affichage cumulatif :

- `current` = unités actives ;
- `max` = nombre d’icônes ;
- maximum actuel 6 ;
- actif = couleur ;
- inactif = désaturé ;
- clic sur une unité inactive active toutes celles avant elle ;
- clic sur une unité active désactive celle-ci et toutes celles après elle.

---

# Inline math

Les valeurs numériques compatibles acceptent :

```text
12     valeur absolue
+3     addition
-2     soustraction
*2     multiplication
x2     multiplication
×2     multiplication
/2     division
÷2     division
```

Division par zéro refusée.

Pour une barre à max, le résultat est ensuite borné entre 0 et max.

---

# Stats — persistance

## Source durable

Les profils Stats sont désormais écrits dans les métadonnées du token Owlbear.

Le profil embarqué inclut :

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

Le travail de fin août a rendu le modèle scene-aware :

- plusieurs copies ;
- instances de scène ;
- ID canonique ;
- source item id ;
- évitement des doublons ;
- synchronisation des copies liées.

## Point ouvert : garbage collection globale

Le besoin validé est de ne pas conserver indéfiniment une configuration si plus aucune copie du token n’existe dans aucune scène.

Le passage aux métadonnées d’item réduit fortement ce risque : supprimer l’item supprime ses métadonnées.

Cependant, le checkpoint documentaire n’a pas identifié une routine explicite parcourant toutes les scènes pour prouver qu’aucune référence canonique centrale ne survit après suppression de la dernière copie. Ce point doit être testé avant d’être marqué « résolu définitivement ».

---

# Stats — Conditions

## Indépendance du Stat Tracker

Un token peut avoir des conditions sans être ajouté au Stat Tracker.

Un profil dormant condition-only peut être créé avec `isTracked = false`.

## Interface

La gestion des conditions a été sortie de la grande fiche token.

Le flux principal est maintenant :

```text
clic droit token
  -> Conditions
    -> recherche
    -> liste
    -> activation/configuration
```

## Affichage

L’ancien rendu en anneaux lourds a été abandonné.

Les conditions utilisent de petites icônes/badges autour du token, avec une disposition radiale implicite.

Le niveau et la durée peuvent être affichés de façon compacte.

## Durées

- Manuelle
- Rounds
- Rencontre
- Repos

`Rounds` et `Rencontre` ne sont utiles/disponibles que lorsqu’Initiative peut piloter la durée.

La synchronisation stocke un encounter id et des informations de round.

## Effets mécaniques

Le catalogue peut décrire des effets, mais ceux-ci ne sont pas automatiquement appliqués à la CA, aux jets, à la vitesse, etc.

L’automatisation PF2e complète reste hors scope actuel.

---

# Stats — Overlays

Le développement est passé par plusieurs étapes :

1. modèle local ;
2. aperçu ;
3. dry-run ;
4. plan de rendu ;
5. SVG ;
6. adaptateur Owlbear ;
7. overlays réels ;
8. visibilité audience-aware ;
9. synchronisation automatique côté MJ ;
10. scène/copies.

Les anciens documents qui parlent uniquement de création manuelle sont donc obsolètes.

Point à tester : une modification effectuée par un joueur depuis le menu rapide écrit le profil mais n’appelle pas directement l’écrivain d’overlay MJ depuis ce composant. La répercussion multi-client immédiate doit être vérifiée en condition réelle.

---

# Stats — Menus contextuels permanents

Le background Owlbear reste actif sans ouverture du popover principal.

Tokens autorisés : images sur `CHARACTER`, `MOUNT`, `PROP`.

## Ajouter/Retirer du Stat Tracker

MJ uniquement.

Le label change selon `tracked`.

## Conditions

MJ uniquement au checkpoint.

## Stats

### MJ

Visible sur les tokens compatibles.

Affiche tous les trackers et leurs contrôles rapides.

### Joueur

Visible uniquement si :

- le token est assigné à ce joueur ;
- au moins un tracker possède `canPlayerEdit = true`.

À l’intérieur, seulement les trackers modifiables sont rendus.

## Interface rapide

Le menu Stats rapide est volontairement dépouillé :

- aucune action `Modifier` ;
- aucune action `Supprimer` ;
- aucune action `Afficher sur token` ;
- aucun `…`.

Il sert uniquement à modifier les valeurs/états.

Layout :

- bar/counter/icon : pleine largeur ;
- fixed/toggle : jusqu’à trois colonnes.

---

# Stats — Permissions joueur

Un token peut être assigné depuis la liste des joueurs Owlbear.

La décision validée le 2 septembre 2026 est de séparer complètement :

```text
canPlayerEdit
visibility
showOnToken
```

### `canPlayerEdit`

Autorise le joueur assigné à voir/manipuler le tracker dans les interfaces de contrôle.

### `visibility`

Définit l’audience d’affichage sur scène.

### `showOnToken`

Définit si le tracker doit être rendu sur le token.

Un tracker autorisé au joueur n’a donc pas besoin d’être `public` pour apparaître dans sa vue de contrôle.

---

# Documentation de référence

Ordre recommandé :

1. `PROJECT_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/features/STATS_V2_SPEC.md`
4. `docs/stats/README.md`
5. `src/features/stats/README.md`

Pour les prompts :

- `docs/stats/Prompt/INDEX_48_PROMPTS_ICONES.md`
- `docs/stats/Prompt/INDEX_EXTRA_PROMPTS_ICONES_V2.md`

Pour l’audio prévu :

- `docs/stats/STAT_AUDIO_FEEDBACK_V1.md`

---

# Points ouverts / dette connue

## Technique

- vérifier le nettoyage global de la dernière copie d’un profil à travers toutes les scènes ;
- tester la propagation instantanée d’une modification joueur vers les overlays multi-clients ;
- harmoniser le versioning package/manifest/jalon Git ;
- continuer à tester les context menus après refresh et changement de scène ;
- documenter une migration si `STAT_TOKEN_PROFILE_VERSION` change.

## UX Stats

- poursuivre le polissage visuel des renderers sur de vrais tokens/rooms ;
- vérifier les largeurs extrêmes du sous-menu Stats ;
- clarifier à long terme le nom technique `readonly` devenu trompeur ;
- définir si une édition avancée d’une condition active doit avoir un geste dédié.

## Futur

- audio Stats ;
- effets mécaniques de conditions uniquement si un chantier dédié est validé ;
- intégration Calendar ;
- intégration Loot Table.

---

# Journal de session / historique détaillé

Cette section est volontairement détaillée. Elle doit permettre à une future session de comprendre non seulement « ce qui existe », mais **comment et pourquoi** l’état actuel a été atteint.

## 22 juin 2026 — fondation de la suite

### Core / Dashboard

- création de la base Core/Dashboard V1 (`d7d4ffef...`) ;
- stabilisation du Dashboard (`9f879ca5...`) ;
- validation de l’architecture modulaire `core/features/shared`.

Décision produit : la suite doit rester modulaire et Calendar/Loot ne seront intégrés qu’après stabilisation des outils tactiques principaux.

### Initiative Tracker

- ajout Initiative Tracker V1 (`6d4dd13c...`) ;
- gestion de l’ordre, des rounds et des tours ;
- comportement ultérieur pour ignorer les participants inactifs/vaincus (`bff78887...`).

### Distance / Range

- ajout de Range Measurement V1 (`9e883d9c...`).

### Stats V1

- ajout du premier Stat Tracker (`b4373745...`).

Cette première journée pose les quatre modules qui restent encore le cœur de l’addon en septembre.

## 23 juin 2026 — Stats V2.1

- migration vers des trackers personnalisables (`3dda9b98...`) ;
- création d’un modèle token + trackers ;
- helpers de labels Stats V2 (`e55211e1...`) ;
- corrections du menu contextuel et des chemins GitHub Pages (`1272be23...`).

Décision durable : les trackers doivent être des objets génériques, pas des champs codés en dur comme PV/CA.

## 24–25 juin 2026 — presets, assignation et permissions préparées

Le module avance vers Stats V2.2 / V2.3 :

- types de token ;
- presets ;
- assignation joueur ;
- préparation des permissions (`d2ae2fe5...`) ;
- filtrage viewer préparé (`7abe2bb7...`).

La structure `assignedPlayerId` / `assignedPlayerName` est introduite pour permettre une évolution ultérieure vers de vraies permissions Owlbear.

## 25 juin 2026 — Conditions V2.4A/B

- catalogue et assignation des conditions (`f5eb9102...`) ;
- durée et édition simple (`e192de72...`).

Les conditions sont stockées séparément des trackers dès cette phase.

## 29 juin 2026 — préparation des effets et des overlays

Progression séquentielle :

- effets descriptifs de conditions (`878756d0...`) ;
- métadonnées d’affichage token (`e88a3acc...`) ;
- modèle d’aperçu (`e021765d...`) ;
- synchronisation dry-run (`2ecf3196...`) ;
- plan de rendu overlay (`dd21ff98...`) ;
- aperçu SVG (`368104d9...`) ;
- adaptateur Owlbear (`a22ae6e9...`).

À ce stade, une grande partie du pipeline existe encore sous forme de préparation prudente.

## 30 août 2026 — Stats V2.5F devient réel

### Overlays et audiences

- ajout de visibilité pour les conditions (`817c284a...`) ;
- préparation d’overlays audience-aware (`302c5802...`) ;
- rendu réel au-dessus des tokens (`20f13e06...`) ;
- normalisation de visibilité (`a418ba0e...`) ;
- persistance de visibilité condition (`ec56dba9...`).

### Stabilisation du show-on-token

- correction des contrôles token (`c2df9572...`) ;
- utilisation de labels natifs (`ffd47afa...`) ;
- correction de reset du toggle d’affichage (`6f937e8e...`) ;
- amélioration du layout overlay (`773280b2...`).

### Synchronisation automatique

- ajout de la synchronisation automatique des overlays Stats (`1a7d2bdb...`) ;
- activation des mises à jour automatiques (`7458bf1e...`).

C’est un changement architectural majeur : toute documentation indiquant « overlays manuels uniquement » devient obsolète.

### Copies et scènes

- liens Stats conscients de la scène (`4a6e4ecf...`) ;
- instances de tokens par scène (`0a110c22...`) ;
- prévention des doublons pour copies (`612e5a7e...`) ;
- synchronisation de toutes les instances liées (`cd821dfd...`) ;
- liste Stats limitée à la scène courante (`b3e664bc...`) ;
- gestion de plusieurs instances (`a1e9b24c...`).

But : une copie ne doit pas devenir un profil indépendant incohérent.

## 31 août 2026 — assets de conditions et Dashboard

- ajout du resolver d’images de conditions (`b87c1846...`) ;
- alignement des conditions sur les assets image (`8446639d...`) ;
- ajustements successifs de taille des overlays ;
- ajout d’une synthèse Stats au Dashboard (`d7258e2b...`) ;
- déplacement de cette synthèse vers Dashboard (`d744ae14...`) ;
- suppression des panneaux d’overview de la page Stats (`b0a3b2a0...`).

Décision UX : la page Stats doit se concentrer sur le travail du token, pas sur les tableaux de synthèse.

## 2 septembre 2026 — session majeure de refonte Stats

Cette journée concentre une grande partie de l’état actuel.

### A. Modale Ajouter/Modifier tracker et bibliothèque PNG

- modernisation de la modale via PR (`efc01f0a...`) ;
- passage à une bibliothèque d’icônes PNG par catégories ;
- corrections TypeScript du registre d’icônes (`01baa74c...`) ;
- suppression du concept de style/skin actif ;
- sélecteur compact avec catégories ;
- accent visuel dérivé de l’icône.

Décision importante : l’icône reste un asset libre, sans sémantique de stat.

### B. Profils persistants dans les tokens

- persistance des profils liés (`354cb367...`) ;
- clarification du retrait sans perte de configuration (`7e0c6103...`) ;
- stockage durable directement dans les tokens Owlbear (`405832f3...`) ;
- hydratation des profils depuis Dashboard (`c816fd32...`).

Cette évolution répond au besoin : fermer/recharger, retirer/réajouter ou copier un token ne doit pas obliger à refaire toutes les stats.

### C. Conditions déplacées vers le clic droit

L’ancien système de gestion de conditions dans la fiche Stats est progressivement supprimé :

- retrait de la gestion conditions de la fiche (`38858278...`) ;
- suppression ancien éditeur/sélecteur/affichage (`17ae36fe...`, `19b99e3f...`, `4f854575...`, `10ccf1f8...`).

En parallèle :

- identifiants menu Conditions (`90ace840...`) ;
- menus enregistrés en background (`e338a2ee...`) ;
- icône Conditions (`de94f8e4...`) ;
- sous-menu Conditions (`14cf699b...`) ;
- style du menu (`be10d03f...`) ;
- remplacement des anneaux par badges radiaux (`bd8aeeaa...`).

### D. Background permanent

Plusieurs commits établissent un vrai entrypoint background :

- `090446c4...`
- `a876fc4c...`
- `a26821a9...`
- `9011c7f3...`
- merge `49bcf579...`

Résultat : Conditions et les menus Stats ne dépendent plus de l’ouverture du popover principal.

### E. Conditions indépendantes du Stat Tracker

Besoin validé : on doit pouvoir poser une condition sur un token même s’il n’est pas suivi dans Stats.

Implémentation :

- profil condition-only (`72052991...`) ;
- ouverture Conditions sur tout token compatible (`9688cc7e...`) ;
- affichage indépendant (`776ccb77...`) ;
- conservation hors Stat Tracker (`eb270b5b...`) ;
- merge `50779812...`.

### F. Intégration visuelle OBR

Sous-menu Conditions :

- synchronisation avec thème OBR (`c9e9dd63...`) ;
- adaptation largeur/thème (`03dfc18a...`) ;
- layout largeur native (`cb57991d...`) ;
- look plus natif (`1daba582...`) ;
- custom selects (`f84ad553...`, `3ff0cfbc...`, `a3908d31...`).

Puis extension à toute l’interface :

- couche UI globale OBR (`718b9b7e...`) ;
- chargement global (`24d4315e...`) ;
- merge `3d980a5d...`.

### G. Durées Conditions ↔ Initiative

- synchronisation avec Initiative (`94c62174...`) ;
- liaison des durées rounds aux rencontres (`af0d5ee9...`) ;
- affichage compact niveau/durée (`a83615a9...`) ;
- menus limités aux vrais tokens (`94a02426...`) ;
- menu enrichi Initiative/durée (`0f703744...`) ;
- style niveau/durée (`612afe9a...`) ;
- options de durée indisponibles visibles/désactivées (`b6a4d1b1...`) ;
- métadonnées visuelles (`a77a8eef...`) ;
- consolidation `25a73925...`.

Décision : `Rounds` et `Rencontre` ne doivent pas prétendre fonctionner si le token n’est pas lié à l’initiative.

### H. Refonte de la Barre à valeur max

La barre passe d’un bloc utilitaire classique à un vrai renderer compact fantasy.

Étapes :

- refonte (`898419cb...`) ;
- couleur principale associée à chaque icône (`981fcfcd...`) ;
- CSS fantasy compact (`bbf2920e...`) ;
- chargement/priorité du style (`f4c6a432...`, `0b4551e6...`) ;
- drag interactif (`8bc4d970...`) ;
- texture liquide + bord ondulé (`44eea369...`, `cbedab9d...`) ;
- saturation de l’icône liée au remplissage (`331c8f60...`) ;
- davantage de bulles (`dee5c58e...`) ;
- placement pseudo-aléatoire et inline math (`aa70a95f...`) ;
- header déplacé au-dessus et texture organique (`56e23321...`).

Décisions UX :

- pas de boutons +/- sur une barre max ;
- current éditable au centre ;
- drag direct ;
- couleur contrôlée par accent déclaré, pas par analyse du PNG.

### I. Refonte de l’Indicateur modifiable

- nouveau renderer counter (`3e866777...`) ;
- style (`aef6f15f...`) ;
- chargement (`49d36ff...`) ;
- actions intégrées au menu compact (`ee2cd753...`) ;
- polissage (`c1289a63...`) ;
- icône centrale rendue plus lisible (`56551f7f...`) ;
- alignement de hauteur/menu (`2c658cb3...`).

Décision : rail non draggable, valeurs non bornées, commandes -5/-1/+1/+5, orbe 48 px.

### J. Indicateur fixe

- support de valeur fixe (`03019445...`) ;
- édition directe (`d645abff...`) ;
- pastille compacte (`079af277...`) ;
- style (`442dbd40...`) ;
- chargement (`ff675770...`).

Décision : le type technique `readonly` reste pour compatibilité mais le comportement UI autorise l’édition directe.

### K. Toggle

- pastille toggle (`cc1ef32a...`) ;
- harmonisation avec l’indicateur fixe (`bd181100...`) ;
- clic visuel (`6f19d4a8...`) ;
- connexion à l’état (`ad176eae...`).

Décision : aucun chiffre ; actif = couleur ; inactif = désaturé.

### L. Indicateur à icônes cumulatives

- configuration cumulative (`850a0249...`) ;
- limite de six unités (`403f277b...`) ;
- compactage (`4ece6264...`) ;
- ajustement toggle/icônes (`0924eb26...`) ;
- rendu cumulatif (`35811222...`) ;
- chargement CSS (`604b6770...`).

Décision : le type historique `icon` sert à ce renderer 1–6 unités.

### M. Grille compacte

- fixes et toggles jusqu’à trois par ligne (`07cdbbeb...`).

But : éviter que des petites valeurs occupent chacune une ligne complète.

### N. Sous-menu Stats de modification rapide

Construction progressive :

- ID du menu (`159ff8b4...`) ;
- interface de trackers contextuelle (`3acc05e9...`) ;
- adaptation largeur Owlbear (`b244f4fb...`) ;
- enregistrement menu (`c024b385...`) ;
- routage de la vue (`2a95b575...`).

La même UI de tracker est réutilisée dans une largeur réduite.

### O. Permission joueur réelle dans Stats

Dernière évolution de la journée :

- alignement des contrôles sur `canPlayerEdit` (`c6af4180...`) ;
- filtrage de la vue joueur (`babb8e44...`) ;
- résumé permission dans metadata (`71b47fbb...`) ;
- synchronisation de ce résumé (`b8ea116c...`) ;
- ouverture du menu rapide aux joueurs autorisés (`fc915507...`) ;
- limitation aux contrôles autorisés (`7f4588a5...`) ;
- suppression des menus admin du sous-menu rapide (`d7f03f4f...`) ;
- correction de typage (`6933800a...`).

Règle finale validée :

```text
joueur assigné + canPlayerEdit
=> tracker visible et modifiable dans les interfaces Stats de contrôle
```

Cette règle est indépendante de la visibilité d’overlay.

### P. Jalon de version et merge final

- commit `60d5b0b9...` nommé `Version 0.3.00` ;
- merge final avec la branche contenant les dernières permissions Stats : `623f04f0...`.

Le checkpoint documentaire a constaté que `package.json` et `manifest.json` ne correspondent pas encore à ce nom de jalon.

---

# Prochaine reprise recommandée

Avant d’ajouter un nouveau grand chantier, faire une phase de tests terrain sur l’état actuel :

1. refresh complet sans popover ouvert ;
2. sous-menu Conditions ;
3. sous-menu Stats MJ ;
4. sous-menu Stats joueur assigné ;
5. joueur non assigné ;
6. copie de token ;
7. retrait/réajout ;
8. changement de scène ;
9. suppression de la dernière copie ;
10. overlays public/private/gm ;
11. durée rounds/rencontre ;
12. interaction multi-client après modification joueur.

Ensuite seulement décider entre :

- stabilisation Stats supplémentaire ;
- audio ;
- approfondissement Initiative/Range ;
- ouverture de l’intégration Calendar ;
- ouverture de l’intégration Loot Table.
