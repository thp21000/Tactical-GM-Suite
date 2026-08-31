# ICON_MASTER_PROMPT_V2

## Tactical GM Suite — Stats Icon Master Prompt V2

## 1. Objectif

Ce document définit le prompt maître de génération des icônes du module **Stats / Stat Tracker** de Tactical GM Suite pour Owlbear Rodeo.

Principe fondamental :

- une icône ne définit jamais la signification d'une stat ;
- le nom d'une stat ne force jamais une icône ;
- le visual type ne force jamais une icône ;
- les presets peuvent proposer une combinaison, mais ne doivent jamais la verrouiller.

Chaque icône possède **un seul asset visuel source principal en couleur**.

Les variantes suivantes sont produites par l'addon et ne doivent pas être générées comme images séparées :

- désaturation / inactive ;
- bar ;
- counter ;
- readonly ;
- toggle ;
- units ;
- hover ;
- selected ;
- disabled ;
- micro-animations.

Le but est d'éviter une explosion du nombre d'assets et de garantir une cohérence visuelle.

---

## 2. Modèle de sortie

Pour chaque icône demandée, générer :

- 1 asset couleur indépendant ;
- 1 image carrée ;
- fond réellement transparent ;
- style fantasy RPG original ;
- aucun cadre UI intégré ;
- aucun texte.

Format cible recommandé :

- PNG avec vraie transparence alpha ;
- ratio 1:1 ;
- source 256×256 px minimum ;
- possibilité de générer plus grand puis réduire proprement en 256×256 px pour le repo.

Chaque icône doit exister dans **son propre fichier**.

---

## 3. Génération en lot — jusqu'à 8 icônes

Le même prompt maître peut demander entre **1 et 8 icônes dans un seul lot**.

Lorsqu'un lot contient plusieurs icônes :

- générer chaque icône comme une image/fichier séparé ;
- ne jamais produire une planche ;
- ne jamais produire une contact sheet ;
- ne jamais produire un sprite sheet ;
- ne jamais placer plusieurs icônes sur le même canvas ;
- ne jamais fusionner plusieurs objets dans une seule icône ;
- conserver exactement la même direction artistique sur toutes les sorties du lot ;
- chaque fichier ne contient que l'objet demandé.

Si le système de génération ne peut pas fournir plusieurs fichiers séparés en une seule passe, exécuter les icônes séquentiellement tout en conservant strictement le même prompt maître et la même direction artistique.

---

## 4. Direction artistique maître

Créer une icône fantasy stylisée originale pour une interface de jeu de rôle tactique.

L'icône doit ressembler à un objet ou symbole issu d'une bibliothèque d'inventaire/interface de RPG fantasy de qualité.

### Style général

- fantasy stylisé ;
- compact ;
- immédiatement reconnaissable ;
- légèrement semi-réaliste ;
- volume 3D doux ;
- silhouette claire ;
- contour sombre propre ou séparation nette avec le fond ;
- reflets modérés ;
- ombres douces ;
- couleurs riches mais non flashy ;
- niveau de détail moyen ;
- lisible à environ 24–32 px dans l'interface.

### Composition

- un seul objet ;
- centré ;
- fond transparent ;
- aucun cadre intégré ;
- aucun disque de fond ;
- aucune plaque UI ;
- aucun décor ;
- aucun personnage ;
- aucun personnage tenant l'objet ;
- l'objet occupe environ 75 à 85 % du canvas ;
- marge transparente de sécurité autour de la silhouette.

### Angle

Préférer :

- légère vue 3/4 ;
- perspective discrète ;
- silhouette immédiatement identifiable.

Une vue de face est autorisée lorsqu'elle améliore la lisibilité, notamment pour les runes, symboles et marques.

### Lumière

Conserver une lumière commune sur toute la bibliothèque :

- lumière douce venant du haut-gauche ;
- ombres légères ;
- reflets utilisés pour identifier la matière ;
- éviter les éclairages cinématographiques trop dramatiques.

### Matières

La matière doit être identifiable lorsqu'elle est pertinente :

- métal = métal ;
- verre = verre ;
- bois = bois ;
- pierre = pierre ;
- énergie magique = énergie magique ;
- matière organique = organique stylisé.

---

## 5. Contraintes globales

Ne pas générer :

- texte ;
- lettres utilisées comme labels ;
- logos ;
- watermark ;
- boutons UI ;
- cadres d'interface ;
- fonds colorés ;
- faux damier de transparence ;
- fausse transparence ;
- décor ;
- personnage ;
- main tenant l'objet ;
- photoréalisme ;
- style moderne flat ;
- contour cartoon excessivement épais ;
- bloom excessif ;
- néon agressif ;
- trop de particules ;
- détails minuscules illisibles ;
- copie ou reproduction proche d'un asset provenant d'un autre addon, jeu, pack d'icônes ou interface protégée.

L'icône doit être originale.

---

## 6. Transparence réelle obligatoire

Le fond doit utiliser un **vrai canal alpha**.

Ne jamais rendre :

- fond blanc ;
- fond noir ;
- fond gris ;
- damier ;
- motif de transparence peint dans l'image.

Les pixels en dehors de la silhouette de l'objet doivent réellement être transparents.

---

## 7. Fiche individuelle d'icône

Chaque icône doit être décrite avec les champs suivants.

### Champs obligatoires

- `displayName`
- `iconId`
- `categoryId`
- `subject`
- `shape`
- `material`
- `palette`
- `specificDetails`
- `avoid`

### Champs optionnels

- `orientation`
- `mood`
- `specialReadabilityNotes`
- `audioConcept`

Exemple :

```yaml
displayName: Heart
iconId: body_heart
categoryId: body
subject: stylized fantasy heart
shape: between a classic symbolic heart and a subtly organic heart
material: stylized organic surface
palette: vivid red with burgundy shadows
specificDetails:
  - subtle highlight on upper-left
  - moderate organic texture
  - clean dark contour
avoid:
  - anatomical realism
  - veins
  - blood
  - gore
  - cracks
  - broken-heart shape
audioConcept: one short soft heartbeat / organic pulse
```

---

## 8. Template lot — jusqu'à 8 icônes

### MASTER INSTRUCTION

Créer un lot cohérent d'icônes originales fantasy RPG pour le module Stats de Tactical GM Suite.

Toutes les icônes doivent respecter la même direction artistique :

- icône d'inventaire RPG fantasy stylisée ;
- légèrement semi-réaliste ;
- compacte et lisible ;
- détails modérés ;
- silhouette claire ;
- contour sombre discret ;
- lumière douce haut-gauche ;
- ombres légères ;
- couleurs riches non fluo ;
- fond réellement transparent ;
- aucun cadre ;
- aucun élément UI ;
- aucun texte ;
- aucun logo ;
- aucun décor ;
- un seul objet par fichier.

Les icônes seront affichées à environ 24–32 px. La lisibilité de la silhouette est prioritaire sur les petits détails.

**Générer chaque icône demandée comme une image/fichier séparé.**

Ne jamais créer de planche, contact sheet, sprite sheet ou image contenant plusieurs icônes.

### ICONS TO GENERATE

1. [ICON SPECIFICATION 1]
2. [ICON SPECIFICATION 2]
3. [ICON SPECIFICATION 3]
4. [ICON SPECIFICATION 4]
5. [ICON SPECIFICATION 5]
6. [ICON SPECIFICATION 6]
7. [ICON SPECIFICATION 7]
8. [ICON SPECIFICATION 8]

N'inclure que le nombre d'entrées réellement nécessaire.

---

## 9. Template icône unique

Créer une icône fantasy stylisée originale représentant :

**[SUBJECT]**

Identité technique :

- display name : `[DISPLAY_NAME]`
- icon ID : `[ICON_ID]`
- category : `[CATEGORY_ID]`

Direction artistique :

- style inventaire RPG fantasy ;
- légèrement semi-réaliste ;
- compacte ;
- silhouette extrêmement lisible ;
- légère vue 3/4 sauf indication contraire ;
- lumière douce haut-gauche ;
- ombres légères ;
- reflets modérés ;
- contour sombre propre ;
- couleurs riches non flashy ;
- détails moyens ;
- lisible à 24–32 px.

Design spécifique :

- forme : `[SHAPE]`
- matière : `[MATERIAL]`
- palette : `[PALETTE]`
- détails : `[SPECIFIC_DETAILS]`

À éviter :

`[AVOID]`

Sortie :

- une seule icône ;
- canvas carré ;
- vrai fond transparent alpha ;
- aucun texte ;
- aucun logo ;
- aucun cadre ;
- aucune plaque UI ;
- aucun décor ;
- aucun personnage ;
- aucun faux damier de transparence.

Cette image est l'unique asset visuel source. Les états désaturé, bar, counter, toggle, readonly, units, hover, selected et disabled seront produits par l'addon.

---

## 10. Critères de validation

Une icône est acceptée seulement si :

1. sa silhouette est immédiatement compréhensible ;
2. elle reste identifiable à 24–32 px ;
3. le fond est réellement transparent ;
4. aucun cadre ou élément UI n'est intégré ;
5. le style correspond aux autres icônes Tactical GM Suite Stats ;
6. les détails ne dominent pas la silhouette ;
7. les couleurs sont riches mais non fluorescentes ;
8. l'asset est original ;
9. l'icône reste utilisable librement pour n'importe quelle stat choisie par le MJ ;
10. elle peut être utilisée dans tous les visual types sans avoir de rendu de tracker intégré dans l'image.

---

## 11. Nommage et stockage

Arborescence recommandée :

```text
src/features/stats/assets/icons/
  body/
  arcane/
  resource/
  object/
```

Exemples :

```text
body_heart.png
body_shield.png
arcane_rune.png
arcane_sword.png
resource_vial.png
resource_coin.png
object_gear.png
object_hourglass.png
```

Règles :

- minuscules ;
- ASCII ;
- séparateur `_` ;
- identifiants stables ;
- pas de nom généré automatiquement ;
- pas de nom sémantique lié à une stat.

---

## 12. Audio

L'audio n'est pas généré par ce prompt visuel.

Chaque icône possède cependant une **direction sonore dédiée**, définie dans :

`STAT_AUDIO_FEEDBACK_V1.md`

La bibliothèque doit donc prévoir une relation stable :

```text
iconId -> soundId
```

Exemple :

```text
body_heart.png
body_heart.ogg
```

Le son suit l'icône choisie, jamais le nom ou la signification de la stat.
