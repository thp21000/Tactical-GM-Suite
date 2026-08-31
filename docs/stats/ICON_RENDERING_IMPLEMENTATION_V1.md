# ICON_RENDERING_IMPLEMENTATION_V1

## Tactical GM Suite — Stats Icon Rendering Implementation V1

## 1. Objectif

Ce document définit comment le module Stats doit produire ses différents rendus visuels à partir d'un **unique asset couleur par icône**.

Principe :

> 1 icône = 1 image source principale.  
> Les variantes sont générées par l'addon.

Ne pas créer de PNG séparés pour :

- bar ;
- counter ;
- readonly ;
- toggle ;
- units ;
- désaturé ;
- hover ;
- selected ;
- disabled.

---

## 2. Séparation des responsabilités

### Asset image

L'asset source fournit :

- silhouette ;
- couleurs originales ;
- matière ;
- volume ;
- reflets ;
- ombres ;
- identité visuelle.

### Addon

L'addon fournit :

- layout ;
- valeur ;
- current / max ;
- remplissage de barre ;
- boutons counter ;
- état readonly ;
- état toggle ;
- répétition units ;
- désaturation ;
- opacité ;
- hover ;
- selected ;
- disabled ;
- animations ;
- feedback sonore.

Aucune logique ne doit déduire la signification d'une stat à partir de son icône.

---

## 3. Définition d'une icône

Structure conceptuelle :

```ts
interface StatIconDefinition {
  iconId: string;
  label: string;
  categoryId: string;
  assetPath: string;
  soundId?: string;
  supportsTint?: boolean;
}
```

Pour les icônes illustrées V1 :

```text
supportsTint = false
```

par défaut.

Ne pas recolorer automatiquement les PNG avec le skin.

---

## 4. Visual Types

Le même asset doit fonctionner dans :

- `icon`
- `bar`
- `counter`
- `readonly`
- `toggle`
- `units` lorsqu'il sera ajouté

Changer de visual type ne change jamais l'asset source.

Changer d'icône ne doit jamais changer :

- le nom ;
- les valeurs ;
- le visual type ;
- les permissions ;
- la visibilité ;
- l'assignation joueur.

---

## 5. État couleur normal

- afficher l'image originale ;
- conserver sa saturation ;
- conserver sa transparence ;
- ne pas la teinter automatiquement ;
- conserver son ratio ;
- éviter le clipping.

Tailles indicatives :

- picker : 28–32 px ;
- tracker compact : 18–24 px ;
- preview : 20–28 px.

---

## 6. État désaturé

Ne pas stocker une seconde image.

Utiliser CSS ou logique équivalente.

Exemple de départ :

```css
.stat-icon--desaturated {
  filter: grayscale(1) saturate(0);
  opacity: 0.42;
}
```

Valeurs ajustables après test.

Usages possibles :

- unités vides ;
- toggle OFF ;
- tracker désactivé ;
- ressource inactive.

La désaturation n'altère jamais les données du tracker.

---

## 7. Renderer `icon`

Composition conceptuelle :

```text
[ICON] [optional value badge]
```

Le conteneur UI gère :

- badge ;
- sélection ;
- hover ;
- focus ;
- animation ;
- son.

L'image reste inchangée.

---

## 8. Renderer `bar`

La barre est construite par React/CSS.

Ne jamais générer une image bar par icône.

Composition :

```text
[ICON] [NAME]                  [CURRENT / MAX]
       [=====================----------]
```

Responsabilités :

- icône à gauche ;
- skin autour ;
- fill CSS/React ;
- valeurs live ;
- aucun changement automatique de renderer selon le max ;
- respect total du choix du MJ.

Une configuration étrange reste valide si elle est techniquement possible.

---

## 9. Renderer `counter`

Le counter est construit par l'addon.

Ne jamais générer une image counter par icône.

Compact :

```text
[ICON] [NAME]        [-] [VALUE] [+]
```

Expanded si déjà prévu :

```text
[-5] [-] [VALUE] [+] [+5]
```

Feedback possible :

- pression bouton ;
- pop valeur ;
- son signature de l'icône.

Les permissions définissent l'interactivité.

---

## 10. Renderer `readonly`

Composition :

```text
[ICON] [NAME]            [VALUE]
```

Pas de modification rapide.

L'icône reste normalement en couleur.

---

## 11. Renderer `toggle`

### Actif

- icône couleur ;
- bordure/glow contrôlé par le skin ;
- animation courte optionnelle ;
- son signature.

### Inactif

- même asset ;
- désaturation et/ou opacité réduite ;
- aucun asset OFF spécifique.

---

## 12. Renderer `units`

`units` répète l'icône choisie.

Exemple :

```text
● ● ● ○ ○
```

où chaque symbole représente l'asset choisi.

Règles :

- une seule image source réutilisée ;
- unités pleines = icône couleur ;
- unités vides = désaturation/opacité côté addon ;
- aucun regroupement automatique ;
- aucune conversion automatique vers bar ;
- aucune limite imposée selon `max`.

Si le MJ veut 30 unités, le système respecte ce choix.

---

## 13. Skins

Les skins sont indépendants des images.

Ils peuvent modifier :

- surface ;
- bordure ;
- bar fill ;
- bar empty ;
- badge ;
- boutons ;
- focus ;
- glow ;
- sélection.

Ils ne recolorent pas automatiquement les PNG.

Exemples :

- cœur rouge + skin violet ;
- pièce dorée + skin acier ;
- rune violette + skin or.

---

## 14. Hover / Selected / Focus

Ces états sont produits par l'UI.

### Hover

- fond léger ;
- éventuelle petite variation de luminosité ;
- pas d'animation permanente.

### Selected

- bordure ou ring visible ;
- fond léger géré par CSS.

### Focus clavier

- outline accessible visible ;
- ne pas dépendre uniquement de la couleur.

---

## 15. Micro-animations

Durées recommandées :

- icon/value pop : 100–140 ms ;
- bar transition : 120–180 ms ;
- increase glow : 150–220 ms ;
- decrease flash : 120–160 ms ;
- toggle : 100–160 ms ;
- unit fill/empty : 120–180 ms.

Respecter :

```css
@media (prefers-reduced-motion: reduce)
```

Le tracker doit rester compréhensible sans animation.

---

## 16. Audio

Chaque icône peut avoir un son signature propre.

Le renderer ne hardcode pas les fichiers audio.

Relation :

```text
iconId -> icon definition -> soundId -> audio registry
```

Exemple :

```ts
{
  iconId: "body_heart",
  soundId: "body_heart"
}
```

Le comportement audio est défini dans :

`STAT_AUDIO_FEEDBACK_V1.md`

Le même son signature peut être réutilisé pour :

- clic ;
- incrément ;
- décrément ;
- toggle.

L'addon peut appliquer de petites variations de lecture selon l'interaction, sans nécessiter plusieurs fichiers par icône.

---

## 17. Fallbacks

Fallbacks uniquement techniques.

Autorisés :

- asset absent ;
- `iconId` inconnu ;
- skin absent ;
- `skinId` inconnu ;
- visual type inconnu ;
- données techniquement invalides.

Interdits :

- remplacer une icône car elle ne semble pas logique ;
- changer un renderer car la valeur paraît élevée ;
- convertir units en bar ;
- changer un skin car il paraît étrange.

Fallback icône recommandé :

```text
object_circle
```

Fallback skin :

```text
neutral
```

---

## 18. Structure cible indicative

```text
src/features/stats/
  assets/
    icons/
    sounds/

  design/
    iconLibrary.ts
    iconCategories.ts
    trackerSkins.ts
    statAudioRegistry.ts

  components/
    StatIcon.tsx
    StatTrackerRenderer.tsx
    StatIconPicker.tsx
    StatPreview.tsx

  components/renderers/
    IconTrackerRenderer.tsx
    BarTrackerRenderer.tsx
    CounterTrackerRenderer.tsx
    ReadonlyTrackerRenderer.tsx
    ToggleTrackerRenderer.tsx
    UnitsTrackerRenderer.tsx

  styles/
    stat-trackers.css
    stat-skins.css
    stat-animations.css
```

Codex doit inspecter le repo existant avant toute implémentation et adapter les composants existants plutôt que dupliquer inutilement l'architecture.

---

## 19. Non-objectifs V1

Ne pas introduire :

- un PNG par visual type ;
- un PNG par état dynamique ;
- association automatique icône/stat ;
- remplacement automatique du renderer ;
- génération d'image runtime ;
- shaders complexes ;
- grosse librairie d'animation ;
- composant React spécifique par icône.
