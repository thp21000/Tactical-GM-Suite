# STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1

> Statut : **direction visuelle validée / prête à implémenter**  
> Date : **5 septembre 2026**  
> Portée : affichage des **trackers Stats sur les tokens Owlbear Rodeo uniquement**.  
> Hors périmètre : Conditions, édition directe depuis le token, automatisation de règles.

---

# 1. Objectif

Remplacer l’affichage Stats actuel sur token, encore basé sur un label texte unique, par un rendu graphique compact, lisible et cohérent avec Tactical GM Suite.

Principes validés :

- tous les trackers visibles d’un token appartiennent à **une seule zone Stats** ;
- cette zone est centrée **au-dessus ou au-dessous du token** ;
- aucun tracker Stats n’est placé en cercle ;
- l’affichage sur token est **strictement informatif** : aucun bouton, aucun `+/-`, aucun drag, aucun contrôle interactif ;
- les Conditions restent un système totalement séparé ;
- le rendu doit rester compact sur une battlemap chargée ;
- la donnée affichée doit rester immédiatement identifiable grâce à l’icône, au libellé court et/ou à la valeur ;
- les assets d’icône actuels sont réutilisés tels quels ;
- la couleur d’accent vient de la couleur déclarée dans `statTrackerIcons.ts`, jamais d’une analyse automatique du PNG.

Le modèle de données actuel des trackers est conservé.

---

# 2. Mapping des types techniques actuels

Le runtime possède actuellement cinq types :

```ts
"bar" | "counter" | "readonly" | "toggle" | "icon"
```

Pour l’affichage sur token, ils sont ramenés à **quatre familles visuelles** :

| Type technique | Nom UI actuel | Rendu token V1 |
|---|---|---|
| `readonly` | Indicateur fixe | **Valeur simple** |
| `counter` | Indicateur modifiable | **Valeur simple** |
| `toggle` | Toggle | **Toggle visuel** |
| `bar` | Barre à valeur max | **Barre à valeur max** |
| `icon` | Icône cumulative | **Répétition d’icônes** |

Important : `readonly` et `counter` restent deux types fonctionnels différents dans l’interface Stats. Ils partagent uniquement leur renderer **sur token**.

---

# 3. Données existantes utilisées

La spec réutilise directement les champs actuels de `StatTracker` :

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

- `showOnToken === false` : le tracker n’entre jamais dans l’overlay ;
- `visibility` continue de piloter son audience ;
- `canPlayerEdit` n’a aucun impact visuel sur le token ;
- aucune nouvelle valeur métier ne doit être dupliquée dans l’overlay ;
- l’overlay est toujours dérivé du tracker embarqué dans le profil du token.

---

# 4. Zone unique — « Stat Dock »

Tous les trackers visibles sont regroupés dans une même zone logique appelée ici **Stat Dock**.

La zone :

- est centrée sur `bounds.center.x` ;
- est ancrée soit en `top`, soit en `bottom` ;
- ne tourne jamais avec le token ;
- reste attachée au token Owlbear ;
- est verrouillée et non interactive ;
- grandit par lignes si plusieurs trackers sont visibles ;
- ne crée jamais une couronne autour du token.

## 4.1 Position configurable

Ajouter dans les paramètres Stats de la room :

```ts
tokenOverlayPosition: "top" | "bottom"
```

Valeur par défaut :

```ts
"top"
```

Le réglage est partagé au niveau de la room et réservé au MJ, comme les autres paramètres Stats de room.

L’implémentation devra faire évoluer `STAT_ROOM_SETTINGS_VERSION` avec migration silencieuse de l’ancienne version :

```text
ancienne room -> tokenOverlayPosition = "top"
```

## 4.2 Échelle

Le dock doit suivre la taille du token dans la même proportion.

Référence :

```ts
tokenScale = tokenDiameter / sceneDpi
```

avec :

```ts
tokenDiameter = max(bounds.width, bounds.height)
```

Toutes les dimensions de base du renderer sont multipliées par `tokenScale` :

- hauteur des badges ;
- largeur minimale ;
- taille des icônes ;
- taille du texte ;
- épaisseur des barres ;
- padding ;
- espacement entre éléments ;
- distance au token.

V1 : pas de changement de proportion selon le type de token.

Tests obligatoires : tokens de `0,5`, `1`, `2` et `3` cases.

---

# 5. Direction artistique commune

Le rendu validé est un **dark fantasy compact**, pas une reproduction littérale de la grande planche de concept.

Sur token, il faut réduire la décoration au strict nécessaire.

## 5.1 Palette commune

Fond :

```text
rgba(18, 20, 28, 0.88)
```

Bord principal : bronze discret, environ :

```text
rgba(190, 151, 92, 0.66)
```

Bord interne / séparation :

```text
rgba(255, 255, 255, 0.10)
```

Texte principal :

```text
#f7f2e8
```

Texte secondaire :

```text
#cbc5bb
```

La couleur fonctionnelle d’un tracker vient de l’accent déclaré pour son `iconId`.

## 5.2 Forme

Style de base :

- petit cartouche sombre ;
- coins légèrement coupés ou rayon court ;
- bord bronze fin ;
- relief très léger ;
- pas de grosse ombre portée ;
- pas de texture lourde ;
- pas d’animation permanente.

Le graphisme doit rester lisible à faible zoom.

---

# 6. Renderer A — Valeur simple

Utilisé pour :

```text
readonly
counter
```

Les deux types ont exactement le même rendu sur token.

## 6.1 Contenu

Ordre :

```text
[ icône ] [ nom court ] [ valeur ]
```

Exemples :

```text
[ bouclier ] CA         18
[ épée ]     Attaque    +7
[ botte ]    Vitesse    9 m
[ flèches ]  Munit.     12
[ fiole ]    Potions    3
```

## 6.2 Source des données

Pour `readonly` et `counter` :

```ts
value = tracker.value ?? tracker.current ?? 0
```

Le renderer ne doit pas faire de différence visuelle entre les deux.

## 6.3 Dimensions de référence — token 1 case

Cibles initiales :

```text
hauteur                 28 px
taille icône            20 px
padding horizontal       6 px
gap icône/texte          5 px
label                    10–11 px
valeur                   14–15 px, semi-bold
largeur min              70 px
largeur max             135 px
```

La largeur est calculée selon le contenu, dans la limite `max`.

Nom trop long : ellipsis.

La valeur ne doit jamais être tronquée avant le libellé.

---

# 7. Renderer B — Toggle visuel

Utilisé pour :

```text
toggle
```

Le token n’affiche jamais les textes `Actif`, `Inactif`, `ON` ou `OFF`.

## 7.1 Contenu

```text
[ icône ] [ nom ]
```

Exemples :

```text
Concentration
Rage
Vol
Détection
```

## 7.2 État actif

Si :

```ts
tracker.enabled === true
```

alors :

- icône à saturation normale ;
- couleur d’accent visible ;
- bord légèrement teinté par l’accent ;
- fond recevant une très légère teinte de l’accent ;
- texte principal clair.

## 7.3 État inactif

Si :

```ts
tracker.enabled !== true
```

alors :

- icône désaturée ;
- opacité de l’icône autour de `0.42–0.50` ;
- bord neutralisé ;
- fond sombre neutre ;
- texte gris mais toujours lisible.

Aucun changement de taille ou de position entre actif/inactif.

## 7.4 Dimensions

Même hauteur et mêmes paddings que le renderer Valeur simple.

Le Toggle appartient donc naturellement à la même ligne que les petits badges numériques.

---

# 8. Renderer C — Barre à valeur max

Utilisé pour :

```text
bar
```

## 8.1 Contenu

Première ligne interne :

```text
[ icône ] [ nom ]                   [ current / max ]
```

Deuxième ligne interne :

```text
[------------- barre de progression -------------]
```

Exemple :

```text
[ cœur ] PV                         24 / 36
         [████████████░░░░░░]
```

## 8.2 Source des données

```ts
current = tracker.current ?? 0
max = tracker.max
```

Pour le calcul visuel :

```ts
ratio = max > 0 ? clamp(current / max, 0, 1) : 0
```

La valeur textuelle continue d’afficher les données réelles.

## 8.3 Cas `max` absent

Les nouvelles créations devraient exiger un `max > 0` pour ce type.

Pour une donnée existante sans max valide :

- ne pas casser le tracker ;
- afficher temporairement la valeur comme un **Valeur simple** ;
- signaler le cas dans le diagnostic développeur.

## 8.4 Couleur

La couleur de remplissage vient de l’accent de l’icône :

```text
Cœur -> rouge
Flamme/arcane -> bleu/violet selon asset
Endurance -> vert si l’icône choisie le définit
etc.
```

Ne pas coder une couleur selon le nom du tracker.

## 8.5 Dimensions — token 1 case

```text
largeur cible          145–165 px
hauteur                 36 px
icône                    22 px
label                    10 px
valeur                   12–13 px
barre                     5 px
rayon barre              2.5 px
```

Une barre prend une ligne entière du dock.

---

# 9. Renderer D — Répétition d’icônes

Utilisé pour :

```text
icon
```

Ce type n’est pas une Condition.

Il représente une quantité par répétition de la même icône.

Le comportement existant est conservé :

```text
current = nombre d’unités actives
max     = nombre total d’unités
1 <= max <= 6
```

## 9.1 Affichage

Pour :

```text
current = 4
max = 6
```

rendu :

```text
[⚡][⚡][⚡][⚡][⚡ gris][⚡ gris]
```

Chaque case = exactement 1 unité.

## 9.2 Actif / inactif

Indices `< current` :

- icône couleur normale ;
- léger accent de bord ;
- fond sombre.

Indices `>= current` :

- même PNG ;
- désaturation complète ;
- opacité autour de `0.35–0.42` ;
- bord gris neutre.

## 9.3 Texte

Dans l’overlay token V1 :

- aucun nombre `4/6` ;
- aucun libellé dans les cases ;
- la quantité doit être comprise visuellement par les unités actives/inactives.

Le nom du tracker reste présent dans les métadonnées/noms techniques des items Owlbear pour le diagnostic.

## 9.4 Dimensions — token 1 case

```text
case                     24 × 24 px
icône utile              18–20 px
gap entre cases           3 px
max                        6 cases
```

Un tracker `icon` reste sur une seule ligne.

---

# 10. Layout interne du Stat Dock

Le dock est un flow horizontal avec retour à la ligne.

## 10.1 Ordre

V1 doit respecter l’ordre du tableau :

```ts
token.trackers
```

Ne plus trier alphabétiquement l’affichage sur token.

La raison : le preset / profil du token doit rester la source de l’ordre visuel.

Une option de réorganisation manuelle pourra être ajoutée plus tard via un champ `displayOrder`, mais elle n’est pas nécessaire pour V1.

## 10.2 Placement par type

- Valeur simple : élément compact, partage une ligne ;
- Toggle : élément compact, partage une ligne ;
- Barre : commence une nouvelle ligne et occupe une ligne complète ;
- Icône cumulative : occupe sa largeur naturelle ; si elle ne rentre pas, elle commence une nouvelle ligne.

## 10.3 Largeur cible

Pour un token 1 case :

```text
largeur max du dock ~ 210–240 px
```

La largeur suit ensuite `tokenScale`.

Objectif : environ 2–3 petits badges par ligne selon leur contenu.

## 10.4 Espacement

Référence 1 case :

```text
gap horizontal  4 px
gap vertical    4 px
distance token  7–9 px
```

Les lignes se développent **à l’opposé du token** :

- `top` : la ligne la plus proche reste au bord du token, les suivantes montent ;
- `bottom` : la ligne la plus proche reste au bord du token, les suivantes descendent.

---

# 11. Overflow

Le moteur actuel limite l’overlay à 6 trackers.

V1 conserve cette limite pour éviter des docks gigantesques :

```text
max trackers visibles = 6
```

Si davantage de trackers ont `showOnToken = true`, ajouter à la fin :

```text
+N
```

sous forme d’un petit badge neutre.

Cette limite concerne le **nombre de trackers**, pas les cases d’un tracker `icon`.

---

# 12. Visibilité et audiences

La spec ne change pas les règles de visibilité existantes :

```text
public
private
gm
```

Le nouveau renderer doit conserver les mêmes APIs Owlbear :

```text
public -> OBR.scene.items
local  -> OBR.scene.local
```

Règle de composition visuelle :

- les éléments publics sont placés en premier ;
- les éléments locaux supplémentaires continuent le même dock ;
- ne pas recréer trois gros panneaux empilés ;
- chaque tracker reste une unité graphique indépendante, ce qui permet de mélanger visuellement les audiences dans une seule zone sans coupler leurs données.

Aucune modification de la sémantique de `visibility` n’est incluse dans cette V1.

---

# 13. Architecture d’implantation recommandée

## 13.1 Problème du renderer actuel

Le pipeline actuel transforme un tracker en :

```ts
{
  label,
  iconId,
  mode,
  priority,
  visibility
}
```

puis le runtime fabrique un seul `Label` Owlbear contenant du texte.

Cela ne suffit plus pour :

- connaître `current/max` séparément ;
- connaître `enabled` ;
- dessiner plusieurs icônes cumulatives ;
- calculer la vraie progression d’une barre ;
- appliquer la désaturation d’un Toggle ;
- utiliser l’accent réel de l’icône.

## 13.2 Nouveau DTO de rendu

Sans changer `StatTracker`, enrichir `StatTokenDisplayItem` / `StatTokenSyncItem` avec un payload de rendu dérivé :

```ts
type StatTokenRenderKind =
  | "simple"
  | "toggle"
  | "bar"
  | "icon-units";

type StatTokenSyncItem = {
  // identité existante
  id: string;
  sourceId: string;
  name: string;
  iconId: string;
  visibility: StatTrackerVisibility;

  // rendu
  renderKind: StatTokenRenderKind;
  accentColor: string;
  value?: number;
  current?: number;
  max?: number;
  enabled?: boolean;
};
```

Mapping :

```text
readonly -> simple + value
counter  -> simple + value
toggle   -> toggle + enabled
bar      -> bar + current + max
icon     -> icon-units + current + max
```

Le label pré-formaté ne doit plus être la source principale du rendu.

## 13.3 Plan de layout

Faire évoluer `statTokenOverlayPlan.ts` :

- `left/right` ne sont pas proposés dans l’UI V1 ;
- `top/bottom` restent les ancres utiles ;
- largeur/hauteur deviennent variables selon `renderKind` ;
- layout en plusieurs lignes ;
- calcul en unités de référence puis multiplication par `tokenScale` ;
- conserver des IDs déterministes pour l’upsert.

## 13.4 Renderer Owlbear

Ne pas revenir au renderer runtime en `data:image/svg+xml`.

Le repo contient encore `statTokenOverlaySvg.ts`, mais l’ancien runtime image a déjà montré des problèmes de chargement de data URL dans Owlbear.

Le renderer V1 doit privilégier des **items natifs Owlbear composés** :

- `Image` pour les PNG d’icône déjà servis par l’extension ;
- `Label` pour les textes/valeurs ;
- primitive native de forme/rectangle pour les plaques et barres si disponible dans la version SDK utilisée ;
- à défaut, petits assets de cadre statiques servis par l’extension + labels/images séparés.

Interdit : générer une image data URL dynamique pour chaque changement de valeur.

## 13.5 Métadonnées

Chaque primitive créée doit porter une métadonnée permettant :

- nettoyage ;
- mise à jour ;
- déduplication ;
- identification du tracker ;
- identification du rôle graphique.

Schéma conceptuel :

```ts
{
  kind: "stats-token-overlay-v2",
  sourceItemId,
  tokenId,
  trackerId,
  visibility,
  role: "plate" | "icon" | "label" | "value" | "bar-track" | "bar-fill" | "unit",
  unitIndex?: number,
  layoutVersion: 2
}
```

IDs déterministes :

```text
tactical-gm-stats-{sourceItemId}-{trackerId}-{role}-{index?}
```

---

# 14. Migration du runtime actuel

Aucune migration de `StatTracker` n’est nécessaire.

Au premier sync V2 :

1. trouver les anciens labels via `STAT_OVERLAY_METADATA_KEY` ;
2. supprimer les anciens items `Label` V1 ;
3. créer les nouvelles primitives graphiques ;
4. conserver intactes les données du token.

Le passage V1 -> V2 de l’overlay doit donc être purement visuel.

---

# 15. Préchargement

Le préchargement PNG déjà présent doit être réutilisé.

Les icônes Trackers sont déjà chargées après les Conditions au démarrage du background.

Aucun nouveau cache spécifique n’est nécessaire pour V1, sauf si des assets statiques de cadre sont ajoutés.

Dans ce cas, les ajouter à `statAssetPreload.ts`.

---

# 16. Synchronisation

L’overlay Stats continue de se synchroniser uniquement depuis :

```text
token.trackers
```

Il ne doit jamais lire :

```text
token.conditions
```

Déclencheurs nécessaires :

- valeur tracker modifiée ;
- toggle modifié ;
- `showOnToken` modifié ;
- visibilité modifiée ;
- icône/nom/type modifié ;
- taille du token modifiée ;
- scène chargée/changée ;
- réglage `tokenOverlayPosition` modifié.

Le resize doit recalculer position **et** dimensions dans la même proportion.

---

# 17. Performance

Objectif : ne pas détruire/recréer toute la zone à chaque incrément de valeur si les primitives existent déjà.

Approche :

- construire la liste désirée ;
- indexer les items existants par ID ;
- supprimer uniquement les IDs devenus obsolètes ;
- mettre à jour les primitives existantes ;
- créer uniquement les nouvelles.

Pour `icon-units`, un passage `3/6 -> 4/6` doit idéalement mettre à jour seulement l’état visuel de l’unité concernée, pas recréer les six.

---

# 18. Accessibilité / lisibilité

- une valeur numérique est toujours affichée en texte pour `simple` et `bar` ;
- un Toggle ne dépend pas uniquement d’une nuance rouge/vert : actif = saturation/lueur, inactif = désaturation/opacité ;
- l’icône cumulative montre le nombre d’unités par répétition physique, pas uniquement par couleur ;
- contraste texte/fond élevé ;
- aucun élément essentiel sous 10 px à l’échelle de référence 1 case ;
- pas d’animation clignotante ;
- respecter `prefers-reduced-motion` si une micro-transition est ajoutée plus tard.

---

# 19. Fichiers principalement concernés par l’implémentation

```text
src/features/stats/services/statTokenDisplay.ts
src/features/stats/services/statTokenSync.ts
src/features/stats/services/statTokenOverlayPlan.ts
src/features/stats/services/statTokenOverlayObrSync.ts
src/features/stats/services/statRoomSettings.ts
src/features/stats/services/statTrackerIcons.ts
src/features/stats/services/statAssetPreload.ts
src/features/stats/i18n/fr.ts
src/features/stats/i18n/en.ts
```

Éventuel nouveau service conseillé :

```text
src/features/stats/services/statTokenOverlayComponents.ts
```

pour isoler les builders graphiques des quatre familles.

`statTokenOverlaySvg.ts` peut rester un outil de preview/dev mais ne doit pas redevenir la voie runtime principale.

---

# 20. Ordre d’implémentation conseillé

## Étape A — modèle de rendu

- enrichir `StatTokenDisplayItem` ;
- enrichir `StatTokenSyncItem` ;
- mapper exactement les 5 types actuels vers les 4 renderers ;
- conserver toutes les règles de visibilité.

## Étape B — layout

- nouveau flow multi-lignes ;
- largeur variable ;
- bar full-row ;
- support top/bottom ;
- scale proportionnel au token.

## Étape C — rendu graphique Owlbear

Dans cet ordre :

1. Valeur simple ;
2. Toggle ;
3. Barre ;
4. Icône cumulative.

## Étape D — paramètres

- ajouter Haut / Bas dans Paramètres Stats ;
- room-wide ;
- FR + EN.

## Étape E — migration et autosync

- remplacement automatique de l’ancien label ;
- resize ;
- refresh scène ;
- copies ;
- cleanup.

## Étape F — polish visuel

Ajuster seulement après test réel :

- tailles ;
- gaps ;
- bordure bronze ;
- transparence ;
- largeur max du dock ;
- lisibilité sur maps claires/sombres.

---

# 21. Checklist d’acceptation

La V1 est considérée conforme si :

- [ ] `readonly` et `counter` ont exactement le même rendu sur token ;
- [ ] aucun contrôle d’édition n’apparaît sur le token ;
- [ ] `toggle` actif = coloré/saturé ;
- [ ] `toggle` inactif = même composant désaturé ;
- [ ] `bar` affiche icône + nom + `current/max` + progression réelle ;
- [ ] `icon` affiche `max` unités et colore exactement `current` unités ;
- [ ] `icon` n’est jamais traité comme une Condition ;
- [ ] tous les trackers Stats sont contenus dans une seule zone top ou bottom ;
- [ ] aucun tracker Stats n’est disposé en cercle ;
- [ ] la zone est centrée sur le token ;
- [ ] le choix Haut/Bas fonctionne room-wide ;
- [ ] les tailles suivent le resize du token ;
- [ ] `showOnToken` continue de fonctionner ;
- [ ] `visibility` continue de fonctionner ;
- [ ] les PNG actuels sont réutilisés ;
- [ ] la couleur vient de `ICON_ACCENTS` ;
- [ ] un tracker avec un nom long ne casse pas le layout ;
- [ ] >6 trackers affiche un overflow compact `+N` ;
- [ ] les anciens labels Stats sont supprimés au premier sync V2 ;
- [ ] modifier les Stats ne déclenche aucune modification des Conditions ;
- [ ] modifier les Conditions ne déclenche aucune apparition du dock Stats ;
- [ ] typecheck et build passent ;
- [ ] test manuel réussi sur tokens 0,5 / 1 / 2 / 3 cases.

---

# 22. Décisions figées par cette V1

```text
Conditions                         hors de cette spec
Stats sur token                    une seule zone
Position                           top ou bottom
Affichage                          lecture seule
readonly + counter                 même renderer token
toggle                             couleur vs désaturation
bar                                current/max + barre réelle
icon                               répétition d’unités actives/inactives
Couleur                            accent de l’icône
Échelle                            proportionnelle au token
Ordre                              ordre token.trackers
Limite                             6 trackers + overflow
Runtime recommandé                 primitives Owlbear natives
Data URL dynamique                 non
```

Cette spec devient la référence pour la prochaine refonte de l’overlay Stats sur token.
