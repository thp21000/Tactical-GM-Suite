# STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1

> Statut : **direction visuelle validée / implémentation active, stabilisation technique en cours**  
> Date de remise à niveau : **5 septembre 2026**  
> Portée : affichage des **trackers Stats sur les tokens Owlbear Rodeo uniquement**.  
> Hors périmètre : Conditions, édition directe depuis le token, automatisation de règles.

---

# 1. Objectif

Le Stat Dock remplace l’ancien affichage Stats basé sur un label texte unique par un rendu graphique compact et lisible.

Principes validés :

- tous les trackers visibles d’un token appartiennent à **une seule zone Stats** ;
- cette zone est centrée **au-dessus ou au-dessous du token** ;
- aucun tracker Stats n’est placé en cercle ;
- l’affichage est strictement informatif ;
- aucun bouton `+/-`, drag ou contrôle interactif sur la scène ;
- Conditions reste un overlay totalement séparé ;
- le rendu doit être compact sur une battlemap chargée ;
- les icônes PNG actuelles sont réutilisées ;
- l’accent vient de `statTrackerIcons.ts`, jamais d’une analyse automatique du PNG.

Le modèle de données `StatTracker` reste inchangé.

---

# 2. Mapping des types techniques

```ts
"bar" | "counter" | "readonly" | "toggle" | "icon"
```

Ils produisent quatre familles visuelles :

| Type technique | Rendu token |
|---|---|
| `readonly` | Valeur simple |
| `counter` | Valeur simple |
| `toggle` | Toggle visuel |
| `bar` | Barre à valeur max |
| `icon` | Répétition d’icônes |

`readonly` et `counter` restent fonctionnellement différents dans l’interface Stats ; ils partagent seulement le même rendu sur token.

---

# 3. Données utilisées

Le dock dérive directement des champs existants :

```ts
name
visualType
iconId
current
max
value
enabled
visibility
canPlayerEdit
showOnToken
```

Règles :

- `showOnToken === false` exclut le tracker ;
- `visibility` pilote l’audience ;
- `canPlayerEdit` n’a aucun effet visuel sur la scène ;
- aucune valeur métier n’est dupliquée dans l’overlay ;
- l’ordre visuel suit `token.trackers`.

---

# 4. Zone unique — Stat Dock

Le Stat Dock :

- est centré sur `bounds.center.x` ;
- est ancré en `top` ou `bottom` ;
- reste attaché au token Owlbear ;
- est verrouillé et non interactif ;
- grandit par lignes ;
- ne crée jamais de couronne autour du token.

Réglage room :

```ts
tokenStatsPosition: "top" | "bottom"
```

Valeur par défaut : `top`.

Le réglage vit dans `statRoomSettings.ts`, version 2.

---

# 5. Échelle et zoom

Formule de base :

```ts
tokenScale = tokenDiameter / sceneDpi
```

avec :

```ts
tokenDiameter = max(bounds.width, bounds.height)
```

Les dimensions logiques du dock utilisent `tokenScale` :

- largeur/hauteur des badges ;
- icônes ;
- barres ;
- gaps ;
- distance au token ;
- tailles des primitives de scène utilisées pour le texte.

Invariants :

1. changer la taille réelle du token doit changer le dock dans la même proportion ;
2. zoomer/dézoomer la caméra ne doit jamais changer la proportion du texte par rapport aux plaques et au token.

Tests obligatoires : token 0,5 / 1 / 2 / 3 cases.

---

# 6. Direction artistique

Style : **dark fantasy compact**.

Le dock doit évoquer la planche de concept validée sans reproduire sa décoration lourde.

Éléments communs :

- plaque sombre ;
- double bordure bronze discrète ;
- petite tuile d’icône intégrée à gauche ;
- très peu d’espace vide ;
- valeur numérique plus forte que le libellé ;
- relief et ombre légers ;
- lisibilité prioritaire sur la décoration.

Assets actuels :

```text
public/assets/stats/stat-plate.svg
public/assets/stats/stat-plate-muted.svg
public/assets/stats/stat-unit.svg
public/assets/stats/stat-unit-muted.svg
```

---

# 7. Renderer A — Valeur simple

Types :

```text
readonly
counter
```

Contenu :

```text
[ icône ] [ nom court ] [ valeur ]
```

Exemples :

```text
[ bouclier ] CA       18
[ épée ]     Attaque  +7
[ flèches ]  Munit.   12
```

Source :

```ts
value = tracker.value ?? tracker.current ?? 0
```

Cible visuelle :

- hauteur compacte ;
- icône dominante mais pas plus haute que la plaque ;
- nom court à gauche ;
- valeur alignée à droite ;
- valeur plus grande/plus lourde que le nom ;
- ellipsis sur nom long, jamais sur la valeur si évitable.

---

# 8. Renderer B — Toggle visuel

Type : `toggle`.

Contenu :

```text
[ icône ] [ nom ]
```

Aucun `ON`, `OFF`, `Actif`, `Inactif` sur le token.

Actif :

- icône couleur ;
- accent visible ;
- texte clair.

Inactif :

- icône désaturée ;
- cadre neutralisé ;
- texte plus terne ;
- même taille et même position.

---

# 9. Renderer C — Barre à valeur max

Type : `bar`.

Contenu :

```text
[ icône ] [ nom ]                [ current/max ]
          [========== barre ================]
```

Ratio :

```ts
ratio = max > 0 ? clamp(current / max, 0, 1) : 0
```

La couleur du remplissage vient de l’accent de l’icône.

La barre doit être intégrée à la plaque : elle ne doit jamais dépasser latéralement ni donner l’impression d’un élément technique flottant.

Si `max` est invalide, le runtime ne doit pas casser ; un fallback de lecture simple peut être utilisé en attendant correction de la donnée.

---

# 10. Renderer D — Répétition d’icônes

Type : `icon`.

Ce type n’est **pas** une Condition.

```text
current = unités actives
max     = unités totales
1 <= max <= 6
```

Exemple :

```text
current = 4
max = 6

[⚡][⚡][⚡][⚡][gris][gris]
```

Règles :

- une case = une unité ;
- actif = PNG couleur ;
- inactif = même PNG désaturé/atténué ;
- aucun `4/6` écrit dans les cases ;
- aucun libellé nécessaire dans la rangée.

---

# 11. Layout du dock

L’ordre respecte `token.trackers`.

Placement :

- Valeur simple : partage une ligne ;
- Toggle : partage une ligne ;
- Barre : ligne dédiée ;
- Icône cumulative : largeur naturelle, ligne dédiée si nécessaire.

Le renderer actuel groupe jusqu’à trois petits éléments sur une ligne.

Gaps : courts et réguliers. La zone doit rester dense.

Les lignes supplémentaires se développent à l’opposé du token :

- position `top` : elles montent ;
- position `bottom` : elles descendent.

---

# 12. Overflow

Limite actuelle :

```text
6 trackers visibles
```

Au-delà :

```text
+N
```

Le `+N` compte les trackers masqués par overflow, pas les unités internes d’un tracker `icon`.

---

# 13. Visibilité et audiences

Audiences :

```text
public
private
gm
```

Les règles existantes restent valides.

`showOnToken` est indépendant de `visibility` et de `canPlayerEdit`.

Le dock doit rester visuellement une seule zone même si les items réels sont répartis entre `OBR.scene.items` et `OBR.scene.local`.

---

# 14. Architecture d’implémentation

Entrée publique :

```text
src/features/stats/services/statTokenOverlayObrSync.ts
```

Renderer actif au 5 septembre 2026 :

```text
statTokenOverlayObrSyncV17
```

État logique : **V17.1**.

V17.1 réutilise la création V12, qui est la dernière base ayant donné le comportement scène/zoom recherché pour les primitives `Text`.

---

# 15. Décision technique sur le texte Owlbear

Les tests en room ont établi :

### `Label`

Avantage : visible et facile à empiler.

Problème : rendu en screen-space ; le texte ne conserve pas la même proportion que le token pendant un zoom.

Conclusion : **non adapté au Stat Dock**.

### `Text`

Avantage : vit dans l’espace scène et suit la géométrie du token.

Problème observé : modifier son layer ou son zIndex après `addItems` l’a fait disparaître dans plusieurs essais.

Conclusion actuelle : utiliser le `Text` natif de V12 et **ne jamais le muter après création**.

---

# 16. Empilement V17.1

Tous les éléments restent sur :

```text
ATTACHMENT
```

Les `Text` restent à leur état natif, notamment zIndex 0.

Seuls les éléments graphiques sont déplacés derrière :

```text
Text natif       zIndex 0   — non muté
mute shape       zIndex -5
icône PNG        zIndex -10
shape/barre      zIndex -20
plaque SVG       zIndex -30
```

Raison : éviter toute mutation post-création du texte tout en gardant les cadres et icônes derrière lui.

---

# 17. Historique des itérations utiles

Les numéros V12→V17 servent de traces de diagnostic, pas de versions produit publiques.

Principaux apprentissages :

- V12 : base géométrique et `Text` de scène utile ;
- essais suivants : amélioration des plaques, mais apparition de problèmes d’empilement ;
- Label : texte visible mais zoom incorrect ;
- changement de layer du `Text` : texte disparu ;
- mutation zIndex du `Text` après création : comportement non fiable ;
- V17.1 : conserver le `Text` intact et reculer uniquement les éléments graphiques.

Ne pas réintroduire un renderer `Label` global pour résoudre un problème d’empilement : cela réintroduirait le bug de zoom déjà confirmé en vidéo.

---

# 18. État de validation

La direction graphique est suffisamment proche du concept pour ne plus justifier une refonte complète des assets de plaque.

Le point bloquant restant est la validation technique du contenu dynamique.

Checklist immédiate :

- [ ] nom et valeur visibles ;
- [ ] texte reste dans la plaque ;
- [ ] texte suit le zoom comme le token ;
- [ ] barre ne dépasse pas ;
- [ ] icône devant la plaque et derrière le texte si nécessaire ;
- [ ] token 0,5 case ;
- [ ] token 1 case ;
- [ ] token 2 cases ;
- [ ] token 3 cases ;
- [ ] position `top` ;
- [ ] position `bottom` ;
- [ ] audiences public/private/gm ;
- [ ] overflow `+N` ;
- [ ] `toggle` actif/inactif ;
- [ ] `icon` actif/inactif.

Une fois cette checklist validée, le chantier peut passer au polish : dimensions, typographie, densité et alignements fins.

---

# 19. Séparation avec Conditions

Invariant absolu :

```text
Stats      -> Stat Dock
Conditions -> couronne de badges
```

Le Stat Dock ne doit jamais utiliser le moteur de couronne Conditions, et une modification Conditions ne doit jamais provoquer la reconstruction de Stats sauf événement explicitement commun au token lui-même.

---

# 20. Références

- `PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/stats/README.md`
- `docs/features/STATS_V2_SPEC.md`
- `src/features/stats/services/statTokenOverlayObrSync.ts`
- `src/features/stats/services/statTokenOverlayObrSyncV12.ts`
- `src/features/stats/services/statTokenOverlayObrSyncV17.ts`
- `src/features/stats/services/statRoomSettings.ts`
