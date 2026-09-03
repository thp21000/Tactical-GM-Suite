# CONDITIONS_MASTER_CATALOG_V1

> **Source de vérité de production — Tactical GM Suite / Conditions**  
> Version documentaire : **V1 — 3 septembre 2026**  
> Portée règles : **D&D 5e 2014** + **Pathfinder 2e Remaster (Player Core)**

Ce document est le **catalogue maître** destiné à servir de base commune pour :

- le futur catalogue runtime des Conditions ;
- la localisation FR / EN ;
- les IDs stables ;
- la génération et le nommage des icônes ;
- les prompts mono-icône ;
- les filtres par système ;
- le modèle de valeur/intensité ;
- les futures migrations depuis le catalogue actuellement embarqué dans `statConditions.ts`.

Il ne doit pas être remplacé par les fichiers PNG ni par le code runtime : **les assets et le code doivent être dérivés de ce catalogue**, pas l'inverse.

---

## 1. Périmètre et sources

### D&D 5e

La référence de cette V1 est **D&D 5e 2014 / SRD 5.1 / Basic Rules 2014**, soit les 15 conditions de l'Appendix A :

`Blinded`, `Charmed`, `Deafened`, `Exhaustion`, `Frightened`, `Grappled`, `Incapacitated`, `Invisible`, `Paralyzed`, `Petrified`, `Poisoned`, `Prone`, `Restrained`, `Stunned`, `Unconscious`.

Source de contrôle :

- D&D Beyond — Basic Rules 2014 — Appendix A: Conditions  
  `https://www.dndbeyond.com/sources/dnd/basic-rules-2014/appendix-a-conditions`
- SRD 5.1  
  `https://media.dndbeyond.com/compendium-images/srd/5.1/SRD-OGL_V5.1.pdf`

La révision D&D 2024 n'est **pas** incluse dans ce catalogue V1. Si elle est ajoutée plus tard, elle devra être traitée comme une variante de règles séparée afin de ne pas écraser le comportement 2014.

### Pathfinder 2e

La référence est **Pathfinder 2e Remaster — Player Core**, dont Archives of Nethys indexe 42 conditions.

Source de contrôle :

- Archives of Nethys — Player Core / Conditions  
  `https://2e.aonprd.com/Conditions.aspx`
- Pathfinder-FR est utilisé comme aide pour la terminologie française lorsque disponible.  
  Les traductions françaises de ce fichier sont des **labels de travail pour Tactical GM Suite** et doivent rester localisables.

### Fusion des doublons

Les conditions clairement équivalentes entre les deux systèmes ne possèdent qu'une seule entrée canonique.

Il existe :

```text
15 conditions D&D 5e
42 conditions PF2e
11 concepts communs fusionnés
= 46 entrées canoniques
```

Les 11 entrées communes sont :

`Blinded`, `Deafened`, `Frightened`, `Grappled/Grabbed`, `Invisible`, `Paralyzed`, `Petrified`, `Prone`, `Restrained`, `Stunned`, `Unconscious`.

**Important :** fusionner une entrée visuelle ne signifie jamais fusionner ses règles.  
Chaque système conserve son propre résumé mécanique.

---

## 2. Ce qui n'est volontairement pas une condition canonique

Le catalogue actuel du code contient quelques entrées utiles en jeu mais qui ne font pas partie des listes officielles de conditions des deux systèmes ciblés.

Exemples :

- `Mort` / `Dead` ;
- `Marque du chasseur` / `Hunter's Mark` ;
- conditions maison ;
- maladies nommées ;
- poisons nommés ;
- malédictions nommées ;
- effets propres à un sort.

Ces éléments pourront être gérés plus tard comme :

```text
condition supplémentaire
effet
marque
affliction
condition custom
```

mais ne doivent pas polluer la base canonique des 46 conditions.

---

## 3. Schéma cible

Chaque entrée du catalogue définit conceptuellement :

```yaml
id: blinded

labels:
  fr: Aveuglé
  en: Blinded

systems:
  - dnd5e-2014
  - pf2e-remaster

severity:
  dnd5e-2014: none
  pf2e-remaster: none

category: sensory

description:
  fr: ...
  en: ...

rulesSummary:
  dnd5e-2014: ...
  pf2e-remaster: ...

icon:
  filename: condition_blinded.png
  accent: "#E15B45"
  subject: ...
  secondaryDetails: ...
  avoid: ...
```

Les descriptions et `rulesSummary` sont des **résumés éditoriaux**, pas des reproductions mot à mot des livres de règles.

---

## 4. Modèles de valeur

Valeurs autorisées dans ce document :

| Modèle | Usage |
|---|---|
| `none` | état actif/inactif, sans intensité |
| `value` | entier positif, généralement PF2e |
| `value-1-6` | cas particulier de l'Épuisement D&D 5e 2014 |
| `typed-value` | valeur + type supplémentaire, utilisé par Dégâts persistants |
| `system-dependent` | entrée commune dont le modèle diffère selon le système |

Le futur code ne doit pas supposer qu'une condition possédant le même `id` a la même mécanique dans tous les systèmes.

---

# 5. Direction artistique maître des icônes

La capture de référence fournie montre la direction recherchée : **petits médaillons circulaires fantasy**, sombres, lisibles et colorés par état.

Il faut reprendre le langage visuel général sans reproduire exactement une interface tierce.

## Format source

```text
Master : 1024 × 1024 px
Ratio  : 1:1
Export : PNG RGBA
Fond extérieur : transparent
Zone utile : médaillon occupant environ 84–90 % du canvas
Lecture cible : 24 à 48 px dans Owlbear
```

## Construction commune

Chaque icône doit posséder :

1. un **médaillon circulaire** ;
2. un contour extérieur sombre, presque noir, avec légère matière métal/pierre ;
3. un anneau d'accent coloré fin mais clairement visible ;
4. un intérieur très sombre, légèrement texturé ;
5. **un pictogramme central unique**, simple et immédiatement reconnaissable ;
6. un léger relief/éclairage haut-gauche ;
7. une petite lueur colorée contrôlée autour du pictogramme ou de l'anneau ;
8. suffisamment d'espace négatif pour rester lisible après réduction.

## Style

```text
fantasy RPG
peint/stylisé
semi-réaliste léger
pictogramme simple
contour sombre
matière discrète
couleurs légèrement désaturées
contraste fort
pas de néon
pas de rendu flat mobile moderne
pas de photoréalisme
```

Le pictogramme doit être plus proche d'un **symbole d'interface fantasy peint** que d'une illustration de personnage.

## Interdits

Pour toute la bibliothèque :

- aucun texte ;
- aucune lettre ;
- aucun nombre ;
- aucun logo D&D ou Pathfinder ;
- aucune rune appartenant explicitement à une licence ;
- aucun drapeau ;
- aucune interface complète autour de l'icône ;
- aucune scène avec plusieurs personnages détaillés ;
- pas de gore explicite ;
- pas de pictogramme médical/industriel moderne lorsqu'une alternative fantasy existe ;
- ne jamais faire dépendre la compréhension uniquement d'une différence rouge/vert.

## Cohérence des couleurs

La couleur sert à distinguer rapidement les familles mais ne remplace jamais le pictogramme :

| Famille | Tendance |
|---|---|
| sensoriel / détection | bleu, cyan, bleu-gris |
| mental / magique | violet, magenta atténué |
| physique / blessure | rouge, rouille, brun |
| mouvement / contrainte | orange, cuivre, bleu acier |
| mort / vitalité critique | rouge profond, bordeaux, noir |
| bénéfique | vert, turquoise |
| social | vert → gris → orange → rouge selon l'attitude |
| objet | acier, cuivre, gris |

Les accents individuels ci-dessous priment sur cette table.

---

## 6. Convention d'assets

Les futurs assets ne devraient plus dépendre de la langue dans leur nom.

Recommandation :

```text
src/features/stats/assets/condition/v2/
  condition_blinded.png
  condition_charmed.png
  condition_clumsy.png
  ...
```

Même PNG pour FR et EN.

La localisation appartient au catalogue, pas au fichier image.

Pendant la migration, les assets actuels dans :

```text
src/features/stats/assets/condition/FR/
```

restent valides tant que le nouveau catalogue n'est pas branché au runtime.

---

# 7. Index des 46 conditions

| # | ID canonique | Nom FR | Name EN | Système(s) | Valeur |
|---:|---|---|---|---|---|
| 1 | `blinded` | Aveuglé | Blinded | D&D5e + PF2e | `none` |
| 2 | `deafened` | Assourdi | Deafened | D&D5e + PF2e | `none` |
| 3 | `frightened` | Effrayé | Frightened | D&D5e + PF2e | `system-dependent` |
| 4 | `grappled` | Agrippé / Empoigné | Grappled / Grabbed | D&D5e + PF2e | `none` |
| 5 | `invisible` | Invisible | Invisible | D&D5e + PF2e | `none` |
| 6 | `paralyzed` | Paralysé | Paralyzed | D&D5e + PF2e | `none` |
| 7 | `petrified` | Pétrifié | Petrified | D&D5e + PF2e | `none` |
| 8 | `prone` | À terre | Prone | D&D5e + PF2e | `none` |
| 9 | `restrained` | Entravé | Restrained | D&D5e + PF2e | `none` |
| 10 | `stunned` | Étourdi | Stunned | D&D5e + PF2e | `system-dependent` |
| 11 | `unconscious` | Inconscient | Unconscious | D&D5e + PF2e | `none` |
| 12 | `charmed` | Charmé | Charmed | D&D5e | `none` |
| 13 | `exhaustion` | Épuisement | Exhaustion | D&D5e | `value-1-6` |
| 14 | `incapacitated` | Neutralisé | Incapacitated | D&D5e | `none` |
| 15 | `poisoned` | Empoisonné | Poisoned | D&D5e | `none` |
| 16 | `broken` | Brisé | Broken | PF2e | `none` |
| 17 | `clumsy` | Maladroit | Clumsy | PF2e | `value` |
| 18 | `concealed` | Masqué | Concealed | PF2e | `none` |
| 19 | `confused` | Confus | Confused | PF2e | `none` |
| 20 | `controlled` | Contrôlé | Controlled | PF2e | `none` |
| 21 | `dazzled` | Ébloui | Dazzled | PF2e | `none` |
| 22 | `doomed` | Condamné | Doomed | PF2e | `value` |
| 23 | `drained` | Drainé | Drained | PF2e | `value` |
| 24 | `dying` | Mourant | Dying | PF2e | `value` |
| 25 | `encumbered` | Encombré | Encumbered | PF2e | `none` |
| 26 | `enfeebled` | Affaibli | Enfeebled | PF2e | `value` |
| 27 | `fascinated` | Fasciné | Fascinated | PF2e | `none` |
| 28 | `fatigued` | Fatigué | Fatigued | PF2e | `none` |
| 29 | `fleeing` | En fuite | Fleeing | PF2e | `none` |
| 30 | `friendly` | Amical | Friendly | PF2e | `none` |
| 31 | `helpful` | Serviable | Helpful | PF2e | `none` |
| 32 | `hidden` | Caché | Hidden | PF2e | `none` |
| 33 | `hostile` | Hostile | Hostile | PF2e | `none` |
| 34 | `immobilized` | Immobilisé | Immobilized | PF2e | `none` |
| 35 | `indifferent` | Indifférent | Indifferent | PF2e | `none` |
| 36 | `observed` | Observé | Observed | PF2e | `none` |
| 37 | `off_guard` | Guarde-basse | Off-Guard | PF2e | `none` |
| 38 | `persistent_damage` | Dégâts persistants | Persistent Damage | PF2e | `typed-value` |
| 39 | `quickened` | Accéléré | Quickened | PF2e | `none` |
| 40 | `sickened` | Malade | Sickened | PF2e | `value` |
| 41 | `slowed` | Ralenti | Slowed | PF2e | `value` |
| 42 | `stupefied` | Stupéfié | Stupefied | PF2e | `value` |
| 43 | `undetected` | Non détecté | Undetected | PF2e | `none` |
| 44 | `unfriendly` | Inamical | Unfriendly | PF2e | `none` |
| 45 | `unnoticed` | Inaperçu | Unnoticed | PF2e | `none` |
| 46 | `wounded` | Blessé | Wounded | PF2e | `value` |

---

# 8. Fiches détaillées

## 01. Aveuglé — Blinded

- **ID canonique :** `blinded`
- **Asset cible :** `condition_blinded.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `sensory`
- **Description FR :** La créature ne peut plus se fier à la vue et doit agir sans perception visuelle normale.
- **Description EN :** The creature can no longer rely on sight and must act without normal visual perception.
- **Résumé règles FR — D&D5e 2014 :** Ne voit pas ; échec automatique des tests exigeant la vue ; ses attaques ont désavantage et les attaques contre elle ont avantage.
- **Rules summary EN — D&D5e 2014 :** Cannot see; automatically fails checks that require sight; its attacks have disadvantage and attacks against it have advantage.
- **Résumé règles FR — PF2e Remaster :** Ne peut pas détecter avec la vue ; les tâches exigeant la vision échouent ; le déplacement et la perception visuelle sont fortement dégradés.
- **Rules summary EN — PF2e Remaster :** Cannot detect using vision; tasks that require sight fail, and visual perception and movement are heavily impaired.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#E15B45`
- **Sujet central :** Un œil stylisé barré par une large entaille diagonale sombre.
- **Détails secondaires :** Pupille presque éteinte, petit halo rouge-orangé sur le pourtour.
- **À éviter :** Pas de visage complet, pas de bandeau, pas de texte.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 02. Assourdi — Deafened

- **ID canonique :** `deafened`
- **Asset cible :** `condition_deafened.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `sensory`
- **Alias FR possible :** `Sourd` dans certains assets/anciens contenus ; normaliser vers `Assourdi` dans la localisation cible.
- **Description FR :** La créature n'entend plus correctement son environnement.
- **Description EN :** The creature can no longer hear its surroundings properly.
- **Résumé règles FR — D&D5e 2014 :** Échec automatique des tests de caractéristique qui reposent sur l'ouïe.
- **Rules summary EN — D&D5e 2014 :** Automatically fails ability checks that rely on hearing.
- **Résumé règles FR — PF2e Remaster :** La perception auditive échoue ou est fortement limitée ; certaines actions auditives peuvent nécessiter un test nu.
- **Rules summary EN — PF2e Remaster :** Auditory perception fails or is severely limited; some auditory actions can require a flat check.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#58A9D6`
- **Sujet central :** Une oreille simple traversée par une cassure ou une onde sonore brisée.
- **Détails secondaires :** Deux petites ondes qui s'interrompent avant l'oreille.
- **À éviter :** Pas de haut-parleur moderne, pas de casque audio.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 03. Effrayé — Frightened

- **ID canonique :** `frightened`
- **Asset cible :** `condition_frightened.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `system-dependent`
- **Catégorie :** `mental`
- **Description FR :** La peur perturbe les décisions, la précision et la capacité de la créature à faire face à la menace.
- **Description EN :** Fear disrupts the creature's decisions, accuracy, and ability to face the threat.
- **Résumé règles FR — D&D5e 2014 :** Désavantage aux tests et attaques tant que la source de peur est visible ; impossible de s'en rapprocher volontairement.
- **Rules summary EN — D&D5e 2014 :** Disadvantage on checks and attacks while the source of fear is in sight; cannot willingly move closer to it.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; applique un malus de statut égal à cette valeur aux tests et DD, normalement réduit de 1 à la fin du tour.
- **Rules summary EN — PF2e Remaster :** Has a value; applies an equal status penalty to checks and DCs, normally decreasing by 1 at the end of the turn.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#9C62D7`
- **Sujet central :** Un visage spectral minimal ou deux yeux écarquillés dans une ombre violette.
- **Détails secondaires :** Petites pointes ou vibration autour du crâne pour évoquer la panique.
- **À éviter :** Pas de visage réaliste détaillé, pas de gore.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 04. Agrippé / Empoigné — Grappled / Grabbed

- **ID canonique :** `grappled`
- **Asset cible :** `condition_grappled.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Labels par système :** D&D5e = `Agrippé / Grappled` ; PF2e = `Empoigné / Grabbed`.
- **Alias de migration :** `agrippe`, `empoigne`, `grabbed`, `grappled`.
- **Description FR :** La créature est physiquement maintenue par une prise qui limite fortement son déplacement.
- **Description EN :** The creature is physically held by a grip that severely limits movement.
- **Résumé règles FR — D&D5e 2014 :** La vitesse devient 0 ; l'état prend fin si l'agrippeur ne peut plus maintenir la prise.
- **Rules summary EN — D&D5e 2014 :** Speed becomes 0; the condition ends if the grappler can no longer maintain the hold.
- **Résumé règles FR — PF2e Remaster :** La cible est immobilisée et guarde-basse ; les actions de manipulation sont risquées tant que la prise persiste.
- **Rules summary EN — PF2e Remaster :** The target is immobilized and off-guard; manipulate actions are risky while the hold persists.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#D0783E`
- **Sujet central :** Une main ou serre fermée autour d'un poignet stylisé.
- **Détails secondaires :** Anneau de pression orangé autour de la zone saisie.
- **À éviter :** Pas de deux personnages complets, pas de scène de lutte complexe.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 05. Invisible — Invisible

- **ID canonique :** `invisible`
- **Asset cible :** `condition_invisible.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `sensory`
- **Description FR :** La créature n'est pas visible normalement, même si sa présence peut encore être révélée autrement.
- **Description EN :** The creature is not normally visible, although its presence can still be revealed by other means.
- **Résumé règles FR — D&D5e 2014 :** Impossible à voir sans moyen spécial ; règles d'attaque favorables/défavorables tant que sa position n'est pas correctement perçue.
- **Rules summary EN — D&D5e 2014 :** Cannot be seen without a special means; attack rules favor the invisible creature while its position is not properly perceived.
- **Résumé règles FR — PF2e Remaster :** Devient généralement non détectée pour les observateurs qui dépendent de la vue ; Chercher peut la rendre cachée.
- **Rules summary EN — PF2e Remaster :** Usually becomes undetected to observers relying on sight; Seek can make it hidden.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#67C4D8`
- **Sujet central :** Une silhouette humanoïde en contour interrompu, dont le centre se dissout.
- **Détails secondaires :** Fragments ou particules cyan qui s'effacent sur un côté.
- **À éviter :** Pas de corps détaillé, pas de cape complète.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 06. Paralysé — Paralyzed

- **ID canonique :** `paralyzed`
- **Asset cible :** `condition_paralyzed.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** Le corps de la créature est figé et elle ne peut pratiquement plus agir physiquement.
- **Description EN :** The creature's body is frozen and it can barely act physically.
- **Résumé règles FR — D&D5e 2014 :** Neutralisée et immobile ; échoue automatiquement à certains jets ; très vulnérable aux attaques proches.
- **Rules summary EN — D&D5e 2014 :** Incapacitated and unable to move; automatically fails some saves and is extremely vulnerable to nearby attacks.
- **Résumé règles FR — PF2e Remaster :** Guarde-basse et presque incapable d'agir physiquement ; seules certaines actions purement mentales restent possibles.
- **Rules summary EN — PF2e Remaster :** Off-guard and almost unable to act physically; only certain purely mental actions remain possible.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#5A8FC8`
- **Sujet central :** Une silhouette droite enfermée dans trois bandes verticales rigides.
- **Détails secondaires :** Lignes bleues froides et symétriques donnant une sensation de verrouillage.
- **À éviter :** Pas de glace explicite afin de ne pas confondre avec un effet de froid.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 07. Pétrifié — Petrified

- **ID canonique :** `petrified`
- **Asset cible :** `condition_petrified.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** La créature est transformée en matière solide et devient pratiquement inerte.
- **Description EN :** The creature is transformed into solid matter and becomes almost completely inert.
- **Résumé règles FR — D&D5e 2014 :** La créature devient une substance solide inanimée, est neutralisée et gagne de fortes protections contre les dégâts.
- **Rules summary EN — D&D5e 2014 :** Becomes an inanimate solid substance, is incapacitated, and gains strong protection against damage.
- **Résumé règles FR — PF2e Remaster :** La créature devient un objet de pierre ou matière similaire et ne peut plus agir normalement.
- **Rules summary EN — PF2e Remaster :** Becomes an object of stone or similar material and can no longer act normally.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#8B8F91`
- **Sujet central :** Un buste ou une main de pierre fissurée, très simplifiée.
- **Détails secondaires :** Petites fissures claires sur une masse gris ardoise.
- **À éviter :** Pas de statue entière détaillée, pas de motif de glace.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 08. À terre — Prone

- **ID canonique :** `prone`
- **Asset cible :** `condition_prone.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `movement`
- **Description FR :** La créature est renversée ou couchée au sol et doit se relever pour retrouver une posture normale.
- **Description EN :** The creature is knocked down or lying on the ground and must stand to regain a normal posture.
- **Résumé règles FR — D&D5e 2014 :** Déplacement limité au rampement ou au relèvement ; attaques de la créature désavantagées ; vulnérabilité différente selon la distance de l'attaquant.
- **Rules summary EN — D&D5e 2014 :** Movement is limited to crawling or standing; its attacks are disadvantaged and vulnerability depends on attacker distance.
- **Résumé règles FR — PF2e Remaster :** Guarde-basse, malus aux attaques ; déplacement principalement via Ramper ou Se relever.
- **Rules summary EN — PF2e Remaster :** Off-guard and penalized on attacks; movement is mainly limited to Crawl or Stand.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#C17B45`
- **Sujet central :** Une silhouette très simple basculée horizontalement avec une flèche descendante.
- **Détails secondaires :** Petit impact ou poussière sous la silhouette.
- **À éviter :** Pas de personnage réaliste, pas de texte 'down'.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 09. Entravé — Restrained

- **ID canonique :** `restrained`
- **Asset cible :** `condition_restrained.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** La créature est attachée ou immobilisée de façon plus sévère qu'une simple prise.
- **Description EN :** The creature is bound or immobilized more severely than by a simple hold.
- **Résumé règles FR — D&D5e 2014 :** Vitesse 0 ; attaques contre elle favorisées ; ses attaques et sauvegardes de Dextérité sont pénalisées.
- **Rules summary EN — D&D5e 2014 :** Speed 0; attacks against the creature are favored, while its attacks and Dexterity saves are penalized.
- **Résumé règles FR — PF2e Remaster :** Immobilisée et guarde-basse ; la plupart des actions d'attaque et de manipulation sont empêchées sauf pour se libérer.
- **Rules summary EN — PF2e Remaster :** Immobilized and off-guard; most attack and manipulate actions are prevented except attempts to escape.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#B56A3E`
- **Sujet central :** Deux liens ou chaînes croisées serrant un cercle central.
- **Détails secondaires :** Nœud central orange sombre et chaînes épaisses très lisibles.
- **À éviter :** Pas de corde fine complexe, pas de cadenas moderne.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 10. Étourdi — Stunned

- **ID canonique :** `stunned`
- **Asset cible :** `condition_stunned.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `system-dependent`
- **Catégorie :** `mental`
- **Description FR :** La créature est désorientée au point de perdre tout ou partie de sa capacité d'action.
- **Description EN :** The creature is so disoriented that it loses some or all of its ability to act.
- **Résumé règles FR — D&D5e 2014 :** Neutralisée, immobile et très vulnérable ; échoue automatiquement à certains jets de sauvegarde.
- **Rules summary EN — D&D5e 2014 :** Incapacitated, unable to move, and highly vulnerable; automatically fails some saving throws.
- **Résumé règles FR — PF2e Remaster :** Possède souvent une valeur correspondant à un nombre d'actions perdues avant disparition.
- **Rules summary EN — PF2e Remaster :** Often has a value representing a number of actions lost before the condition ends.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#D8B34F`
- **Sujet central :** Une tête simplifiée entourée de trois petites étoiles ou éclats orbitaux.
- **Détails secondaires :** Halo doré terne et léger décalage des éclats pour évoquer le vertige.
- **À éviter :** Pas d'étoiles cartoon brillantes, pas de visage comique.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 11. Inconscient — Unconscious

- **ID canonique :** `unconscious`
- **Asset cible :** `condition_unconscious.png`
- **Système(s) :** D&D5e + PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** La créature a perdu connaissance et ne peut pas agir consciemment.
- **Description EN :** The creature has lost consciousness and cannot act consciously.
- **Résumé règles FR — D&D5e 2014 :** Neutralisée, chute à terre, lâche ce qu'elle tient et est très vulnérable aux attaques proches.
- **Rules summary EN — D&D5e 2014 :** Incapacitated, falls prone, drops held items, and is highly vulnerable to nearby attacks.
- **Résumé règles FR — PF2e Remaster :** Ne peut pas agir, est généralement à terre, aveuglée et guarde-basse, avec de fortes pénalités de perception et de défense.
- **Rules summary EN — PF2e Remaster :** Cannot act, is usually prone, blinded, and off-guard, with major penalties to perception and defense.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#64718A`
- **Sujet central :** Une tête inclinée avec yeux fermés et une petite onde de sommeil sombre.
- **Détails secondaires :** Halo bleu-gris très faible, posture clairement inerte.
- **À éviter :** Pas de 'Zzz', pas de lit, pas de texte.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 12. Charmé — Charmed

- **ID canonique :** `charmed`
- **Asset cible :** `condition_charmed.png`
- **Système(s) :** D&D5e
- **Modèle de valeur :** `none`
- **Catégorie :** `mental`
- **Description FR :** La créature est magiquement ou émotionnellement influencée en faveur de celui qui la charme.
- **Description EN :** The creature is magically or emotionally influenced in favor of the charmer.
- **Résumé règles FR — D&D5e 2014 :** Ne peut pas attaquer le charmeur ni le cibler avec un effet nuisible ; le charmeur est avantagé dans certaines interactions sociales.
- **Rules summary EN — D&D5e 2014 :** Cannot attack the charmer or target the charmer with harmful effects; the charmer is favored in certain social interactions.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#C65AA8`
- **Sujet central :** Un petit cœur encadré par deux spirales hypnotiques ou un œil doux.
- **Détails secondaires :** Lueur rose-violet atténuée, symbole simple et ambigu entre émotion et enchantement.
- **À éviter :** Pas de cœur romantique brillant, pas de personnage séduisant.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 13. Épuisement — Exhaustion

- **ID canonique :** `exhaustion`
- **Asset cible :** `condition_exhaustion.png`
- **Système(s) :** D&D5e
- **Modèle de valeur :** `value-1-6`
- **Catégorie :** `physical`
- **Description FR :** L'épuisement représente une dégradation progressive des capacités physiques et mentales.
- **Description EN :** Exhaustion represents a progressive decline in physical and mental capability.
- **Résumé règles FR — D&D5e 2014 :** État à 6 niveaux ; les effets s'accumulent jusqu'à réduire fortement vitesse, tests, attaques, sauvegardes et PV, puis causer la mort au niveau 6.
- **Rules summary EN — D&D5e 2014 :** A 6-level condition; effects accumulate, progressively harming checks, speed, attacks, saves, and Hit Points, with death at level 6.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#9A7658`
- **Sujet central :** Une silhouette courbée sous un poids ou une jauge en six encoches sans chiffres.
- **Détails secondaires :** Teinte brun-gris, épaules tombantes, six petites marques discrètes sur l'anneau interne.
- **À éviter :** Pas de nombres visibles, pas de barre de stamina moderne.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 14. Neutralisé — Incapacitated

- **ID canonique :** `incapacitated`
- **Asset cible :** `condition_incapacitated.png`
- **Système(s) :** D&D5e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** La créature est temporairement incapable de prendre des actions ou réactions.
- **Description EN :** The creature is temporarily unable to take actions or reactions.
- **Résumé règles FR — D&D5e 2014 :** Ne peut effectuer ni action ni réaction.
- **Rules summary EN — D&D5e 2014 :** Cannot take actions or reactions.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#7D8491`
- **Sujet central :** Une silhouette centrale barrée par deux chevrons ou un symbole d'arrêt abstrait.
- **Détails secondaires :** Métal gris et petit halo rouge sombre pour signaler l'impossibilité d'agir.
- **À éviter :** Pas de panneau routier STOP, pas de texte.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 15. Empoisonné — Poisoned

- **ID canonique :** `poisoned`
- **Asset cible :** `condition_poisoned.png`
- **Système(s) :** D&D5e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** Un poison perturbe les capacités physiques et la précision de la créature.
- **Description EN :** Poison disrupts the creature's physical capability and accuracy.
- **Résumé règles FR — D&D5e 2014 :** Désavantage aux jets d'attaque et aux tests de caractéristique.
- **Rules summary EN — D&D5e 2014 :** Has disadvantage on attack rolls and ability checks.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#6BA34A`
- **Sujet central :** Une goutte de poison ou petite fiole avec une tête de mort très simplifiée intégrée.
- **Détails secondaires :** Vert olive toxique, une ou deux bulles sombres.
- **À éviter :** Pas de symbole biohazard moderne, pas de fiole détaillée.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 16. Brisé — Broken

- **ID canonique :** `broken`
- **Asset cible :** `condition_broken.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `object`
- **Description FR :** Un objet a subi assez de dégâts pour ne plus fonctionner normalement.
- **Description EN :** An object has taken enough damage that it no longer functions normally.
- **Résumé règles FR — PF2e Remaster :** S'applique principalement aux objets ayant atteint leur seuil de rupture ; leur fonction est réduite ou impossible jusqu'à réparation.
- **Rules summary EN — PF2e Remaster :** Primarily applies to objects that reach their Broken Threshold; their function is reduced or unavailable until repaired.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#B46A48`
- **Sujet central :** Un bouclier ou disque métallique fendu en deux par une large fissure.
- **Détails secondaires :** Fissure lumineuse cuivre et petits éclats.
- **À éviter :** Pas d'arme complète, pas de texte.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 17. Maladroit — Clumsy

- **ID canonique :** `clumsy`
- **Asset cible :** `condition_clumsy.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `physical`
- **Description FR :** La coordination et la précision gestuelle de la créature sont diminuées.
- **Description EN :** The creature's coordination and physical precision are impaired.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; malus de statut égal à cette valeur aux tests et DD basés sur la Dextérité.
- **Rules summary EN — PF2e Remaster :** Has a value; applies an equal status penalty to Dexterity-based checks and DCs.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#D28A45`
- **Sujet central :** Un pied ou une botte qui trébuche sur une petite pierre stylisée.
- **Détails secondaires :** Deux lignes de déséquilibre autour de la cheville.
- **À éviter :** Pas de personnage entier, pas de gag cartoon.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 18. Masqué — Concealed

- **ID canonique :** `concealed`
- **Asset cible :** `condition_concealed.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `detection`
- **Description FR :** La cible est visible de façon imparfaite à travers brouillard, faible lumière ou autre obstruction non solide.
- **Description EN :** The target is imperfectly visible through fog, dim light, or another non-solid obstruction.
- **Résumé règles FR — PF2e Remaster :** Une cible masquée demande généralement un test nu DD 5 pour être affectée par une action qui la cible directement.
- **Rules summary EN — PF2e Remaster :** Directly targeting a concealed creature generally requires a DC 5 flat check.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#6FA9B4`
- **Sujet central :** Une silhouette partiellement cachée derrière trois volutes de brume.
- **Détails secondaires :** Cyan grisâtre, moitié du pictogramme nette et moitié estompée.
- **À éviter :** Pas de nuage météo réaliste, pas d'œil barré.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 19. Confus — Confused

- **ID canonique :** `confused`
- **Asset cible :** `condition_confused.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `mental`
- **Description FR :** La créature ne distingue plus correctement alliés, ennemis et priorités d'action.
- **Description EN :** The creature can no longer reliably distinguish allies, enemies, or priorities.
- **Résumé règles FR — PF2e Remaster :** Le comportement devient erratique et agressif ; la créature ne traite plus normalement les autres comme alliés et agit sous fortes contraintes.
- **Rules summary EN — PF2e Remaster :** Behavior becomes erratic and aggressive; the creature no longer treats others normally as allies and acts under strong constraints.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#9B63B8`
- **Sujet central :** Deux flèches courbes opposées tournant autour d'une tête ou d'un point central.
- **Détails secondaires :** Violet poussiéreux, chemins qui se croisent sans former un simple symbole de recyclage.
- **À éviter :** Pas de point d'interrogation, pas d'emoji.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 20. Contrôlé — Controlled

- **ID canonique :** `controlled`
- **Asset cible :** `condition_controlled.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `magical`
- **Description FR :** Une force extérieure dicte les actions de la créature.
- **Description EN :** An outside force dictates the creature's actions.
- **Résumé règles FR — PF2e Remaster :** Le contrôleur détermine ou dirige les actions de la cible selon l'effet qui impose l'état.
- **Rules summary EN — PF2e Remaster :** The controller determines or directs the target's actions according to the effect imposing the condition.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#8D58C7`
- **Sujet central :** Une petite silhouette de marionnette suspendue à trois fils depuis une main abstraite.
- **Détails secondaires :** Violet sombre, fils très épais pour rester lisibles à petite taille.
- **À éviter :** Pas de marionnette détaillée, pas de main réaliste.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 21. Ébloui — Dazzled

- **ID canonique :** `dazzled`
- **Asset cible :** `condition_dazzled.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `sensory`
- **Description FR :** La vue est perturbée par une lumière ou un effet visuel sans être totalement supprimée.
- **Description EN :** Vision is impaired by bright light or another visual effect without being completely lost.
- **Résumé règles FR — PF2e Remaster :** Si la vue est le seul sens précis, les créatures et objets sont considérés comme masqués.
- **Rules summary EN — PF2e Remaster :** If sight is the creature's only precise sense, creatures and objects are treated as concealed.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#E1C95A`
- **Sujet central :** Un œil face à un éclat lumineux à quatre pointes.
- **Détails secondaires :** Jaune pâle non néon avec reflet blanc cassé très limité.
- **À éviter :** Pas de soleil complet, pas de lens flare réaliste.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 22. Condamné — Doomed

- **ID canonique :** `doomed`
- **Asset cible :** `condition_doomed.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `death`
- **Description FR :** La vie de la créature est fragilisée et son seuil de mort se rapproche.
- **Description EN :** The creature's life is weakened, bringing its death threshold closer.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; réduit d'autant la valeur de Mourant à laquelle la créature meurt ; diminue généralement avec un repos complet.
- **Rules summary EN — PF2e Remaster :** Has a value; lowers the Dying value at which the creature dies and normally decreases after a full rest.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#A43E52`
- **Sujet central :** Un crâne minimal au-dessus d'un cœur fissuré ou d'une flamme de vie qui rétrécit.
- **Détails secondaires :** Rouge sombre tirant vers le bordeaux, anneau intérieur presque noir.
- **À éviter :** Pas de gore, pas de chiffres, pas de sablier pour éviter la confusion avec durée.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 23. Drainé — Drained

- **ID canonique :** `drained`
- **Asset cible :** `condition_drained.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `physical`
- **Description FR :** La vitalité de la créature a été aspirée ou affaiblie.
- **Description EN :** The creature's vitality has been siphoned or weakened.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; pénalise les tests/DD basés sur Constitution et réduit les PV actuels et maximums selon le niveau et la valeur.
- **Rules summary EN — PF2e Remaster :** Has a value; penalizes Constitution-based checks/DCs and reduces current and maximum Hit Points based on level and value.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#9E475F`
- **Sujet central :** Un cœur dont une goutte ou un filament d'énergie est aspiré vers l'extérieur.
- **Détails secondaires :** Bordeaux-violet, centre du cœur plus sombre et vide.
- **À éviter :** Pas de vampire détaillé, pas de seringue.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 24. Mourant — Dying

- **ID canonique :** `dying`
- **Asset cible :** `condition_dying.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `death`
- **Description FR :** La créature est à zéro point de vie et lutte activement contre la mort.
- **Description EN :** The creature is at zero Hit Points and actively fighting against death.
- **Résumé règles FR — PF2e Remaster :** Toujours accompagné d'une valeur ; la créature est inconsciente, effectue des tests de récupération et meurt normalement à Mourant 4.
- **Rules summary EN — PF2e Remaster :** Always has a value; the creature is unconscious, makes recovery checks, and normally dies at Dying 4.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#C33E42`
- **Sujet central :** Un cœur très faible sous un tracé de pulsation qui s'éteint.
- **Détails secondaires :** Rouge profond, dernière pulsation lumineuse sur fond presque noir.
- **À éviter :** Pas d'ECG médical réaliste, pas de chiffre 4.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 25. Encombré — Encumbered

- **ID canonique :** `encumbered`
- **Asset cible :** `condition_encumbered.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `movement`
- **Description FR :** La créature transporte une charge suffisamment lourde pour gêner ses mouvements.
- **Description EN :** The creature carries enough weight to hinder movement.
- **Résumé règles FR — PF2e Remaster :** Rend Maladroit 1 et impose une pénalité à toutes les Vitesses tant que la charge reste excessive.
- **Rules summary EN — PF2e Remaster :** Makes the creature Clumsy 1 and applies a penalty to all Speeds while the excessive load remains.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#A57A51`
- **Sujet central :** Un sac ou coffre compact posé sur une silhouette de botte ou d'épaule.
- **Détails secondaires :** Brun acier, impression de poids vers le bas.
- **À éviter :** Pas de sac à dos moderne détaillé, pas de balance.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 26. Affaibli — Enfeebled

- **ID canonique :** `enfeebled`
- **Asset cible :** `condition_enfeebled.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `physical`
- **Description FR :** La force musculaire et la puissance physique de la créature sont réduites.
- **Description EN :** The creature's muscular strength and physical power are reduced.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; malus de statut égal à cette valeur aux tests et DD basés sur la Force.
- **Rules summary EN — PF2e Remaster :** Has a value; applies an equal status penalty to Strength-based checks and DCs.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#B86155`
- **Sujet central :** Un bras ou poing dont les lignes musculaires s'effacent ou se fissurent.
- **Détails secondaires :** Rouge-brun, petite flèche descendante intégrée sans texte.
- **À éviter :** Pas de bodybuilder, pas de symbole de statistique 'STR'.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 27. Fasciné — Fascinated

- **ID canonique :** `fascinated`
- **Asset cible :** `condition_fascinated.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `mental`
- **Description FR :** L'attention de la créature est captivée par un sujet au détriment de ce qui l'entoure.
- **Description EN :** The creature's attention is captivated by a subject at the expense of its surroundings.
- **Résumé règles FR — PF2e Remaster :** Pénalise perception et compétences et limite les actions de concentration à ce qui concerne le sujet de la fascination.
- **Rules summary EN — PF2e Remaster :** Penalizes Perception and skill checks and restricts concentrate actions to matters related to the subject of fascination.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#B56BC6`
- **Sujet central :** Un œil ou visage de profil attiré vers un petit cristal/éclat central.
- **Détails secondaires :** Violet rosé, lignes convergentes vers l'objet de fascination.
- **À éviter :** Pas de cœur, afin de ne pas confondre avec Charmé.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 28. Fatigué — Fatigued

- **ID canonique :** `fatigued`
- **Asset cible :** `condition_fatigued.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `physical`
- **Description FR :** La fatigue réduit les défenses et rend les efforts prolongés plus difficiles.
- **Description EN :** Fatigue reduces defenses and makes prolonged effort harder.
- **Résumé règles FR — PF2e Remaster :** Inflige notamment une pénalité de statut à la CA et aux jets de sauvegarde et gêne certaines activités prolongées.
- **Rules summary EN — PF2e Remaster :** Notably applies a status penalty to AC and saving throws and hinders some prolonged activities.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#8A7768`
- **Sujet central :** Une tête penchée ou paupière lourde avec une petite goutte de sueur.
- **Détails secondaires :** Brun-gris désaturé, forme lourde et basse.
- **À éviter :** Pas de 'Zzz', pas de lit, afin de distinguer de Inconscient.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 29. En fuite — Fleeing

- **ID canonique :** `fleeing`
- **Asset cible :** `condition_fleeing.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `mental`
- **Description FR :** La créature doit consacrer ses efforts à s'éloigner de la source de sa peur ou de la menace.
- **Description EN :** The creature must devote its efforts to moving away from the source of fear or danger.
- **Résumé règles FR — PF2e Remaster :** Doit utiliser ses actions pour fuir aussi efficacement que possible et ne peut normalement pas Retarder ou Se tenir prêt.
- **Rules summary EN — PF2e Remaster :** Must spend its actions fleeing as effectively as possible and normally cannot Delay or Ready.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#D17A43`
- **Sujet central :** Une botte ou silhouette en mouvement avec trois traits dirigés vers l'extérieur.
- **Détails secondaires :** Orange sombre, direction très claire vers la droite ou le haut-droite.
- **À éviter :** Pas de personnage entier, pas de flèches contradictoires.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 30. Amical — Friendly

- **ID canonique :** `friendly`
- **Asset cible :** `condition_friendly.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `social`
- **Description FR :** La créature apprécie le personnage et est disposée à lui accorder des demandes raisonnables.
- **Description EN :** The creature likes the character and is willing to grant reasonable requests.
- **Résumé règles FR — PF2e Remaster :** Attitude sociale positive ; plus favorable qu'Indifférent, moins engagée que Serviable.
- **Rules summary EN — PF2e Remaster :** A positive social attitude; more favorable than Indifferent but less committed than Helpful.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#63A75D`
- **Sujet central :** Deux mains ouvertes ou deux petits profils tournés l'un vers l'autre avec un cercle positif.
- **Détails secondaires :** Vert doux, formes arrondies et accueillantes.
- **À éviter :** Pas de poignée de main d'entreprise réaliste, pas de cœur romantique.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 31. Serviable — Helpful

- **ID canonique :** `helpful`
- **Asset cible :** `condition_helpful.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `social`
- **Description FR :** La créature souhaite activement aider le personnage.
- **Description EN :** The creature actively wants to help the character.
- **Résumé règles FR — PF2e Remaster :** Attitude sociale très positive ; la créature accepte généralement de fournir une aide raisonnable.
- **Rules summary EN — PF2e Remaster :** A highly positive social attitude; the creature generally agrees to provide reasonable help.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#76B84F`
- **Sujet central :** Une main tendue soulevant une petite étoile ou une seconde main.
- **Détails secondaires :** Vert-jaune lumineux mais non néon, geste ascendant.
- **À éviter :** Pas de symbole médical, pas de texte.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 32. Caché — Hidden

- **ID canonique :** `hidden`
- **Asset cible :** `condition_hidden.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `detection`
- **Description FR :** L'observateur connaît approximativement la position de la cible mais ne la perçoit pas avec précision.
- **Description EN :** The observer roughly knows the target's location but cannot perceive it precisely.
- **Résumé règles FR — PF2e Remaster :** La position est connue, mais cibler directement demande généralement un test nu DD 11.
- **Rules summary EN — PF2e Remaster :** The position is known, but directly targeting the creature generally requires a DC 11 flat check.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#587F9D`
- **Sujet central :** Une silhouette derrière un demi-disque ou une ombre, avec seulement un œil visible.
- **Détails secondaires :** Bleu acier, moitié de la forme occultée nettement.
- **À éviter :** Pas de brume complète afin de distinguer de Masqué.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 33. Hostile — Hostile

- **ID canonique :** `hostile`
- **Asset cible :** `condition_hostile.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `social`
- **Description FR :** La créature veut activement nuire au personnage ou s'opposer à lui.
- **Description EN :** The creature actively wants to harm or oppose the character.
- **Résumé règles FR — PF2e Remaster :** Attitude sociale la plus négative ; la créature agit contre le personnage et refuse normalement ses requêtes.
- **Rules summary EN — PF2e Remaster :** The most negative social attitude; the creature acts against the character and normally refuses requests.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#C94B45`
- **Sujet central :** Deux profils ou lames simples pointant l'un vers l'autre.
- **Détails secondaires :** Rouge rouille, angles agressifs et symétriques.
- **À éviter :** Pas de drapeau, pas de faction ou symbole politique.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 34. Immobilisé — Immobilized

- **ID canonique :** `immobilized`
- **Asset cible :** `condition_immobilized.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `movement`
- **Description FR :** La créature ne peut pas effectuer normalement d'actions de déplacement.
- **Description EN :** The creature cannot normally perform movement actions.
- **Résumé règles FR — PF2e Remaster :** Empêche les actions possédant le trait déplacement tant que la cause n'est pas levée.
- **Rules summary EN — PF2e Remaster :** Prevents actions with the move trait until the cause is removed.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#7087A2`
- **Sujet central :** Une botte ancrée au sol par deux crochets ou une racine stylisée.
- **Détails secondaires :** Bleu acier, lignes verticales qui donnent une impression d'ancrage.
- **À éviter :** Pas de chaîne complète pour ne pas confondre avec Entravé.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 35. Indifférent — Indifferent

- **ID canonique :** `indifferent`
- **Asset cible :** `condition_indifferent.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `social`
- **Description FR :** La créature n'éprouve ni sympathie ni hostilité particulière envers le personnage.
- **Description EN :** The creature feels neither particular goodwill nor hostility toward the character.
- **Résumé règles FR — PF2e Remaster :** Attitude sociale neutre et généralement point de départ de nombreuses interactions.
- **Rules summary EN — PF2e Remaster :** A neutral social attitude and the usual starting point for many interactions.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#8C8C82`
- **Sujet central :** Deux profils neutres séparés par une fine ligne verticale.
- **Détails secondaires :** Gris olive, symétrie calme sans mouvement.
- **À éviter :** Pas de smiley, pas de signe égal textuel.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 36. Observé — Observed

- **ID canonique :** `observed`
- **Asset cible :** `condition_observed.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `detection`
- **Description FR :** L'observateur perçoit clairement la cible et connaît précisément sa position.
- **Description EN :** The observer clearly perceives the target and knows its exact position.
- **Résumé règles FR — PF2e Remaster :** État normal de détection avec un sens précis ; aucune incertitude particulière de position.
- **Rules summary EN — PF2e Remaster :** Normal detection state using a precise sense; the target's position is known without special uncertainty.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#5AA6C8`
- **Sujet central :** Un œil ouvert centré sur une petite silhouette nette.
- **Détails secondaires :** Bleu clair, lignes propres et sans obstruction.
- **À éviter :** Pas de cible militaire ni réticule moderne.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 37. Guarde-basse — Off-Guard

- **ID canonique :** `off_guard`
- **Asset cible :** `condition_off_guard.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `combat`
- **Alias FR de migration :** `Pris au dépourvu` (pré-Remaster) ; le label de travail Remaster retenu ici est `Guarde-basse`.
- **Description FR :** La créature est momentanément moins capable de se défendre contre une attaque.
- **Description EN :** The creature is momentarily less able to defend against an attack.
- **Résumé règles FR — PF2e Remaster :** Inflige un malus de circonstances de −2 à la CA contre les attaques auxquelles l'état s'applique.
- **Rules summary EN — PF2e Remaster :** Applies a −2 circumstance penalty to AC against attacks for which the condition applies.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#D48745`
- **Sujet central :** Un bouclier incliné avec une ouverture nette sur un côté.
- **Détails secondaires :** Orange cuivre, une brèche visible dans la garde.
- **À éviter :** Pas de bouclier fissuré : il doit sembler mal positionné, pas cassé.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 38. Dégâts persistants — Persistent Damage

- **ID canonique :** `persistent_damage`
- **Asset cible :** `condition_persistent_damage.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `typed-value`
- **Catégorie :** `damage`
- **Description FR :** Un effet continue d'infliger des dégâts à la créature à la fin de ses tours.
- **Description EN :** An effect continues to deal damage to the creature at the end of its turns.
- **Résumé règles FR — PF2e Remaster :** Stocke normalement un montant et un type de dégâts ; dégâts à la fin du tour puis test nu DD 15 par défaut pour mettre fin à l'effet.
- **Rules summary EN — PF2e Remaster :** Normally stores an amount and damage type; damage is taken at the end of the turn, followed by a default DC 15 flat check to end the effect.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#E05C3E`
- **Sujet central :** Une petite flamme, goutte corrosive ou éclat générique entourant une plaie stylisée.
- **Détails secondaires :** Rouge-orange avec trois micro-symboles abstraits permettant d'évoquer plusieurs types de dégâts sans en privilégier un.
- **À éviter :** Pas d'élément unique trop spécifique comme seulement du feu ; le type de dégâts doit rester une donnée séparée.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 39. Accéléré — Quickened

- **ID canonique :** `quickened`
- **Asset cible :** `condition_quickened.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `movement`
- **Description FR :** La créature agit plus vite et reçoit une action supplémentaire sous les limites de l'effet.
- **Description EN :** The creature acts faster and gains an additional action under the effect's restrictions.
- **Résumé règles FR — PF2e Remaster :** Gagne normalement 1 action supplémentaire au début du tour ; l'effet précise souvent comment elle peut être utilisée.
- **Rules summary EN — PF2e Remaster :** Normally gains 1 additional action at the start of the turn; the source often restricts how it can be used.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#53B7A2`
- **Sujet central :** Trois chevrons ou une botte traversée par un double trait de vitesse.
- **Détails secondaires :** Turquoise-vert, mouvement ascendant et léger halo.
- **À éviter :** Pas d'éclair pur afin de ne pas confondre avec magie électrique.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 40. Malade — Sickened

- **ID canonique :** `sickened`
- **Asset cible :** `condition_sickened.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `physical`
- **Description FR :** La créature souffre de nausées ou d'un malaise qui dégrade ses performances générales.
- **Description EN :** The creature suffers nausea or sickness that degrades overall performance.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; malus de statut égal à cette valeur à tous les tests et DD ; empêche généralement d'ingérer volontairement et peut être réduit en vomissant.
- **Rules summary EN — PF2e Remaster :** Has a value; applies an equal status penalty to all checks and DCs, generally prevents voluntary ingestion, and can be reduced by retching.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#72A04A`
- **Sujet central :** Un estomac simplifié ou une silhouette courbée avec une petite spirale de nausée.
- **Détails secondaires :** Vert olive, légère teinte jaune sale.
- **À éviter :** Pas de symbole poison, pas de visage vomissant détaillé.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 41. Ralenti — Slowed

- **ID canonique :** `slowed`
- **Asset cible :** `condition_slowed.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `movement`
- **Description FR :** La créature récupère moins d'actions que normalement au début de son tour.
- **Description EN :** The creature regains fewer actions than normal at the start of its turn.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; réduit du même nombre les actions récupérées au début du tour.
- **Rules summary EN — PF2e Remaster :** Has a value; regains that many fewer actions at the start of the turn.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#6E86B3`
- **Sujet central :** Un sablier très simple devant une flèche de mouvement freinée.
- **Détails secondaires :** Bleu-violet sombre, sensation de retard et de poids.
- **À éviter :** Pas de glace, pas de tortue cartoon.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 42. Stupéfié — Stupefied

- **ID canonique :** `stupefied`
- **Asset cible :** `condition_stupefied.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `mental`
- **Description FR :** Les facultés mentales et magiques de la créature sont brouillées.
- **Description EN :** The creature's mental and magical faculties are clouded.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; pénalise les tests/DD mentaux et rend l'incantation de sorts incertaine via un test nu.
- **Rules summary EN — PF2e Remaster :** Has a value; penalizes mental checks/DCs and makes spellcasting uncertain through a flat check.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#8A64C5`
- **Sujet central :** Un cerveau ou rune centrale partiellement brouillée par une onde cassée.
- **Détails secondaires :** Violet bleuté, centre net mais bords déphasés.
- **À éviter :** Pas d'étoiles de vertige, pour distinguer d'Étourdi.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 43. Non détecté — Undetected

- **ID canonique :** `undetected`
- **Asset cible :** `condition_undetected.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `detection`
- **Description FR :** L'observateur sait ou soupçonne que la cible existe mais ignore sa position exacte.
- **Description EN :** The observer knows or suspects the target exists but does not know its exact position.
- **Résumé règles FR — PF2e Remaster :** La case de la cible est inconnue ; il faut la chercher ou deviner son emplacement avant de tenter de la cibler.
- **Rules summary EN — PF2e Remaster :** The target's square is unknown; the observer must find it or guess its location before attempting to target it.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#536D86`
- **Sujet central :** Une silhouette fantôme très faible entourée d'un cercle de recherche incomplet.
- **Détails secondaires :** Bleu-gris très sombre, contour intermittent.
- **À éviter :** Pas de point d'interrogation, pas de radar moderne.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 44. Inamical — Unfriendly

- **ID canonique :** `unfriendly`
- **Asset cible :** `condition_unfriendly.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `social`
- **Description FR :** La créature n'apprécie pas le personnage et se montre peu disposée à l'aider.
- **Description EN :** The creature dislikes the character and is reluctant to help.
- **Résumé règles FR — PF2e Remaster :** Attitude sociale négative mais moins extrême qu'Hostile.
- **Rules summary EN — PF2e Remaster :** A negative social attitude, but less extreme than Hostile.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#B07045`
- **Sujet central :** Deux profils détournés l'un de l'autre ou une main repoussée.
- **Détails secondaires :** Orange-brun, formes fermées et non agressives.
- **À éviter :** Pas d'armes, afin de distinguer d'Hostile.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 45. Inaperçu — Unnoticed

- **ID canonique :** `unnoticed`
- **Asset cible :** `condition_unnoticed.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `none`
- **Catégorie :** `detection`
- **Description FR :** L'observateur n'a aucune conscience de la présence de la cible.
- **Description EN :** The observer has no awareness that the target is present.
- **Résumé règles FR — PF2e Remaster :** La cible est non seulement non détectée : l'observateur ignore complètement qu'elle se trouve là.
- **Rules summary EN — PF2e Remaster :** The target is not merely undetected; the observer is completely unaware that it is present.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#46566B`
- **Sujet central :** Une silhouette presque effacée derrière un œil fermé.
- **Détails secondaires :** Bleu nuit/gris, contraste volontairement faible mais symbole central encore lisible.
- **À éviter :** Pas de transparence excessive qui rendrait l'icône illisible à 24 px.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

## 46. Blessé — Wounded

- **ID canonique :** `wounded`
- **Asset cible :** `condition_wounded.png`
- **Système(s) :** PF2e
- **Modèle de valeur :** `value`
- **Catégorie :** `death`
- **Description FR :** La créature a récemment frôlé la mort et devient plus vulnérable si elle retombe à zéro point de vie.
- **Description EN :** The creature has recently been near death and becomes more vulnerable if reduced to zero Hit Points again.
- **Résumé règles FR — PF2e Remaster :** Possède une valeur ; lorsque la créature redevient Mourante, cette valeur augmente sa valeur initiale de Mourant.
- **Rules summary EN — PF2e Remaster :** Has a value; when the creature becomes Dying again, this value increases its initial Dying value.

**Mini cahier des charges de l'icône**
- **Accent recommandé :** `#D65449`
- **Sujet central :** Un cœur marqué d'une cicatrice nette mais encore intact.
- **Détails secondaires :** Rouge brique, petite couture ou entaille en travers du cœur.
- **À éviter :** Pas de cœur brisé en deux, pas de sang abondant.
- **Composition :** pictogramme centré, silhouette épaisse, détails limités aux éléments nécessaires ; aucun texte ; médaillon et anneau conformes à la charte maître.

---

# 9. Règles de génération des prompts individuels

Une fois une fiche validée, le prompt mono-icône devra être dérivé de :

```text
CHARTE MAÎTRE
+
nom de la condition
+
sujet central
+
accent
+
détails secondaires
+
éléments à éviter
```

Le prompt individuel ne doit pas réinterpréter la condition.

Workflow recommandé :

```text
1 condition
→ 1 prompt autonome
→ 1 génération
→ 1 PNG maître
→ validation à 32 px
→ intégration asset
```

Avant validation d'une image :

- vérifier la lecture à 32 px ;
- vérifier la lecture en niveaux de gris ;
- comparer avec au moins 4 autres conditions ;
- vérifier qu'elle ne peut pas être confondue avec une condition proche ;
- vérifier que le pictogramme reste compréhensible sans connaître sa couleur.

---

# 10. Groupes à comparer pendant la validation visuelle

Certaines icônes doivent impérativement être testées côte à côte :

### Perception

```text
Aveuglé
Ébloui
Masqué
Caché
Invisible
Observé
Non détecté
Inaperçu
```

### Contrôle physique

```text
Agrippé / Empoigné
Entravé
Immobilisé
Paralysé
À terre
```

### Altération mentale

```text
Charmé
Confus
Contrôlé
Fasciné
Effrayé
Étourdi
Stupéfié
```

### Vitalité

```text
Blessé
Drainé
Mourant
Condamné
Fatigué
Épuisement
Malade
Empoisonné
```

### Vitesse / économie d'actions

```text
Accéléré
Ralenti
Étourdi
En fuite
Encombré
```

Les pictogrammes doivent rester distincts même lorsqu'ils partagent une famille de couleur.

---

# 11. Migration depuis le catalogue runtime actuel

Le fichier runtime actuel :

```text
src/features/stats/services/statConditions.ts
```

ne correspond pas encore à ce catalogue maître.

Il contient une sélection historique d'environ vingt conditions visibles ainsi que plusieurs définitions legacy.

La migration devra être une étape séparée et testée.

Principes :

1. ne pas supprimer brutalement les anciens IDs ;
2. fournir des alias vers les nouveaux IDs canoniques ;
3. conserver la lecture des métadonnées de tokens déjà sauvegardées ;
4. migrer les noms de fichiers vers des IDs indépendants de la langue ;
5. ajouter la locale EN sans dupliquer les PNG ;
6. filtrer le picker en fonction du système choisi ;
7. ne pas transformer automatiquement les résumés mécaniques en automatisation de règles ;
8. conserver les conditions custom comme extension future séparée.

Exemples d'alias évidents :

```text
aveugle        -> blinded
effraye        -> frightened
empoigne       -> grappled
agrippe        -> grappled
inconscient    -> unconscious
paralyse       -> paralyzed
petrifie       -> petrified
etourdi        -> stunned
a-terre        -> prone
assourdi       -> deafened
sourd          -> deafened
confus         -> confused
ebloui         -> dazzled
fascine        -> fascinated
ralenti        -> slowed
stupefie       -> stupefied
accelere       -> quickened
blesse         -> wounded
draine         -> drained
malade         -> sickened
immobilise     -> immobilized
```

Les entrées historiques `mort`, `marque-du-chasseur`, `ensorcele`, etc. ne doivent pas être détruites pendant la migration : elles doivent être reclassées ou gardées comme legacy/custom tant qu'une stratégie de compatibilité n'est pas validée.

---

# 12. Décisions à conserver

- **46 entrées canoniques** dans cette V1.
- Une seule icône lorsqu'un concept est commun à D&D5e et PF2e.
- Règles séparées par système même lorsque l'icône est commune.
- D&D5e V1 = règles 2014.
- PF2e V1 = Remaster / Player Core.
- FR et EN utilisent le même asset.
- Les IDs sont techniques et indépendants de la langue.
- Les icônes n'embarquent ni valeur, ni durée, ni niveau.
- L'intensité est rendue par l'UI de Tactical GM Suite, jamais dessinée dans le PNG.
- Le type de dégâts de `persistent_damage` est une donnée runtime, pas un pictogramme différent obligatoire.
- Les descriptions sont des résumés utiles à l'addon ; elles ne doivent pas devenir une copie des textes de règles.
- Une future automatisation mécanique devra être conçue séparément de l'identité visuelle.

---

# 13. Statut

```text
Catalogue conceptuel : VALIDÉ COMME BASE DE PRODUCTION
Icônes V2 : À PRODUIRE
Prompts mono-icône : À DÉRIVER
Migration runtime : À FAIRE
Localisation EN runtime : À FAIRE
D&D 2024 : HORS PÉRIMÈTRE V1
```
