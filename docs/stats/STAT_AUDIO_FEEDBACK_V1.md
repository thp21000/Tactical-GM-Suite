# STAT_AUDIO_FEEDBACK_V1

## Tactical GM Suite — Stats Icon Audio Feedback V1

## 1. Objectif

Ce document définit le feedback audio du module Stats / Stat Tracker.

Contrairement aux états visuels dérivés, l'identité sonore est volontairement liée à **l'icône choisie**.

Chaque icône peut donc posséder son propre son signature lié à l'objet ou au symbole représenté.

Exemples :

- cœur -> battement doux ;
- bouclier -> impact métallique mat ;
- rune -> chime magique cristallin ;
- épée -> courte résonance de lame ;
- fiole -> verre + léger liquide ;
- pièce -> tintement de monnaie ;
- engrenage -> clic mécanique ;
- sablier -> petit son de verre/sable.

Le son reste un feedback UI : court, discret et non envahissant.

---

## 2. Décision V1

V1 utilise :

> **1 son signature spécifique par icône**

Le même fichier peut être réutilisé lorsque :

- l'utilisateur clique sur l'icône ;
- la valeur augmente ;
- la valeur diminue ;
- un toggle change ;
- une action rapide autorisée est effectuée.

Cela évite de créer plusieurs sons par interaction.

Avec 48 icônes :

```text
48 images
48 sons signature
```

et non :

```text
48 × plusieurs variantes audio
```

---

## 3. Variation runtime sans nouveaux fichiers

L'addon peut appliquer de petites variations au même son.

### Click

- son original ;
- pitch neutre ;
- volume UI standard bas.

### Increment

- même son ;
- très légère variation positive de pitch ou de tonalité.

### Decrement

- même son ;
- très légère variation négative.

### Toggle ON

- même identité ;
- variation positive légère possible.

### Toggle OFF

- même identité ;
- variation négative légère possible.

Les variations doivent rester discrètes.

Le son doit toujours être reconnaissable comme celui de la même icône.

---

## 4. Brief de génération sonore

Chaque son doit être :

- original ;
- court ;
- propre ;
- fantasy/tactique ;
- évocateur de l'icône ;
- discret ;
- adapté à des répétitions fréquentes ;
- sans voix ;
- sans musique ;
- sans ambiance longue ;
- sans sample protégé.

Durée recommandée :

```text
80 ms à 450 ms environ
```

Quelques sons peuvent aller jusqu'à environ 600 ms si nécessaire, mais les sons courts sont préférables.

---

## 5. Direction sonore

Ambiance cible :

- interface RPG fantasy ;
- tactile ;
- légèrement premium ;
- sobre ;
- non cartoon ;
- non arcade ;
- non mobile-game reward spam ;
- non agressive.

Le son accompagne l'action, il ne prend pas le dessus.

---

## 6. Volume et lecture

Tous les sons doivent être normalisés à un volume perçu cohérent.

L'addon devrait prévoir :

- activation/désactivation des sons Stats ;
- volume des sons Stats si pratique ;
- volume par défaut bas ;
- limitation des superpositions lors de clics rapides.

Comportement recommandé :

- petit cooldown ou voice limiting ;
- empêcher des dizaines d'instances simultanées ;
- éventuellement réutiliser un petit pool audio.

---

## 7. Registry audio

Chaque définition d'icône peut référencer un son.

Exemple :

```ts
{
  iconId: "body_heart",
  label: "Heart",
  categoryId: "body",
  assetPath: bodyHeartIcon,
  soundId: "body_heart"
}
```

Registry :

```ts
{
  soundId: "body_heart",
  assetPath: bodyHeartSound
}
```

Recommandation :

```text
iconId == soundId
```

lorsque possible.

---

## 8. Nommage

Visuel :

```text
body_heart.png
```

Audio :

```text
body_heart.ogg
```

ou autre format final compatible navigateur/build.

Le codec final doit être validé après vérification du repo et des navigateurs ciblés.

Un WAV peut servir de master de production, mais n'est pas forcément idéal à embarquer à cause de sa taille.

---

## 9. Arborescence recommandée

```text
src/features/stats/assets/
  icons/
    body/
    arcane/
    resource/
    object/

  sounds/
    body/
    arcane/
    resource/
    object/
```

Exemple :

```text
icons/body/body_heart.png
sounds/body/body_heart.ogg
```

Les structures visuelle et audio restent parallèles.

---

## 10. Lot test — directions sonores

| Icône | ID | Direction sonore |
|---|---|---|
| Cœur | `body_heart` | battement de cœur court, doux, grave |
| Bouclier | `body_shield` | petit impact métallique mat / tap de bouclier |
| Rune | `arcane_rune` | scintillement/chime magique cristallin très court |
| Épée | `arcane_sword` | courte résonance propre de lame |
| Fiole | `resource_vial` | petit tintement de verre + mouvement liquide discret |
| Pièce | `resource_coin` | tintement bref d'une pièce fantasy |
| Engrenage | `object_gear` | clic métallique mécanique compact |
| Sablier | `object_hourglass` | petit tick de verre + texture très courte de sable |

Important :

Le son suit **l'icône**, pas la signification de la stat.

Si le MJ choisit le cœur pour représenter des munitions, le tracker utilisera quand même le son signature du cœur.

---

## 11. Règle pour les 48 icônes

Chaque icône V1 finale reçoit :

- 1 image ;
- 1 direction sonore ;
- 1 `soundId` ;
- 1 fichier audio final.

La direction sonore doit être écrite dans la fiche de l'icône avant génération.

Exemple :

```yaml
displayName: Shield
iconId: body_shield
categoryId: body

visual:
  subject: stylized fantasy shield
  material: steel
  palette: cool gray-blue

audio:
  concept: short muted metal shield tap
  durationTarget: 180-300ms
  character: protective, solid, restrained
  avoid:
    - huge impact
    - sword clash
    - cinematic boom
```

---

## 12. Template prompt sonore

```text
Créer un son UI original, court, fantasy RPG, pour l'icône Tactical GM Suite Stats : [ICON NAME].

Le son doit évoquer : [SOUND CONCEPT].

Style :
feedback d'interface fantasy discret, tactile, propre, sobre, adapté à des utilisations répétées.

Durée :
environ [TARGET DURATION].

Caractère :
[CHARACTER / MATERIAL / FEEL].

À éviter :
voix, musique, ambiance, impact cinématographique, basses excessives, transitoire agressive, son arcade, son cartoon, longue réverbération, sample protégé.

Le même son sera utilisé pour le clic sur l'icône et les changements de valeur. Les petites variations de pitch/lecture selon l'interaction seront produites par l'addon.
```

---

## 13. Événements runtime

Événements logiques recommandés :

```text
iconClick
valueIncrease
valueDecrease
toggleOn
toggleOff
```

Tous résolvent le son signature de l'icône choisie.

Flux :

```text
tracker.iconId
    -> iconLibrary.soundId
    -> audioRegistry.asset
    -> variation selon interaction
```

---

## 14. Fallback audio

Si le son spécifique d'une icône manque :

1. le tracker continue de fonctionner ;
2. aucune erreur utilisateur bloquante ;
3. interaction silencieuse par défaut.

Recommandation V1 :

> Son spécifique absent = silence.

Cela évite d'attacher un son sans rapport à l'icône.

---

## 15. Réglages utilisateur

À prévoir :

```text
Stats UI Sounds: On / Off
Stats UI Sound Volume: 0–100%
```

Le son ne doit jamais être obligatoire.

Respecter les restrictions autoplay des navigateurs.

Les sons ne doivent jouer qu'après une vraie interaction utilisateur.

---

## 16. Accessibilité / confort

L'audio ne doit jamais être le seul feedback.

Chaque action conserve un feedback visuel.

Interdits :

- boucles sonores ;
- battement permanent ;
- hum magique permanent ;
- ambiance continue ;
- sons très forts ;
- gros impacts métalliques ;
- fréquences aiguës agressives.

---

## 17. Performance

Avec 48 sons potentiels :

- éviter de précharger 48 gros WAV ;
- préférer lazy-load ou chargement raisonnable ;
- mettre en cache après premier usage ;
- compresser correctement les assets finaux.

---

## 18. Règle d'implémentation Codex

Ne pas hardcoder la logique audio dans chaque renderer.

Créer un helper/service réutilisable, conceptuellement :

```text
playStatIconSound(iconId, interactionType)
```

Responsabilités :

1. résoudre `iconId` ;
2. résoudre `soundId` ;
3. résoudre l'asset ;
4. appliquer le volume ;
5. appliquer la petite variation d'interaction ;
6. gérer cooldown / overlap ;
7. jouer le son ;
8. échouer silencieusement si absent.

---

## 19. Non-objectifs V1

Ne pas créer :

- plusieurs fichiers son par icône ;
- musique ;
- soundscape ;
- sons basés sur le nom de la stat ;
- sons basés sur le preset si l'utilisateur change d'icône ;
- sons persistants.

L'audio suit l'**icône sélectionnée**.

---

## 20. Documents liés

Génération visuelle :

`ICON_MASTER_PROMPT_V2.md`

Rendu runtime :

`ICON_RENDERING_IMPLEMENTATION_V1.md`

Audio :

`STAT_AUDIO_FEEDBACK_V1.md`

Ensemble :

```text
ICON
  -> 1 image couleur source
  -> 1 son signature spécifique
  -> états visuels dérivés côté addon
  -> variations audio légères côté addon
```
