# Stats — Documentation technique et visuelle

> Mise à jour : **5 septembre 2026**.  
> Manifest cible de cette remise à niveau : **0.3.47**.

Ce dossier regroupe les documents de référence du module Stats et du sous-système Conditions.

Documents principaux :

```text
docs/stats/
  README.md
  STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md
  CONDITIONS_MASTER_CATALOG_V1.md
  CONDITIONS_RUNTIME_SYNC.md
  CONDITION_DERIVATIONS.md
  STAT_AUDIO_FEEDBACK_V1.md
  Prompt/
```

Le cahier des charges fonctionnel général reste `docs/features/STATS_V2_SPEC.md`.

---

## 1. Principes du module Stats

Un tracker est une donnée libre. Toujours séparer :

```text
sens utilisateur
type visuel
icône
valeur
permissions
visibilité
affichage sur token
```

L’icône ne définit jamais la sémantique du tracker.

Exemple valide :

```text
Nom       = Munitions
Type      = Barre
Icône     = body_heart
Current   = 12
Max       = 20
```

Le système doit l’accepter même si l’association paraît atypique.

## 2. Types techniques

```text
bar
counter
readonly
toggle
icon
```

Dans l’interface Stats principale :

- `bar` : current/max, valeur modifiable, drag, calcul inline ;
- `counter` : valeur modifiable, contrôles `-5/-1/+1/+5` ;
- `readonly` : indicateur fixe sans contrôles rapides, valeur toujours éditable ;
- `toggle` : actif en couleur, inactif désaturé ;
- `icon` : 1 à 6 unités cumulatives.

Les `readonly` et `toggle` peuvent être regroupés jusqu’à trois par ligne dans l’interface normale.

Calcul inline :

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

## 3. Bibliothèque d’icônes Trackers

Runtime :

```text
src/features/stats/assets/icons/
  Corps & Protection/
  Arcane & Combat/
  Ressources & Richesses/
  Objets & Marques/
```

Les catégories servent uniquement au classement.

La couleur d’accent est déclarée dans `services/statTrackerIcons.ts`. Elle ne doit pas être déduite automatiquement du PNG.

## 4. Persistance

Le profil Stats durable est embarqué dans les métadonnées du token Owlbear.

Il contient notamment :

- trackers ;
- conditions ;
- assignation miroir ;
- type ;
- groupe ;
- notes ;
- timestamps ;
- état `isTracked`.

Retirer un token du Stat Tracker conserve son profil. Réajouter doit restaurer la configuration.

## 5. Assignation joueur

La source de vérité n’est plus dans Stats.

Service Core :

```text
src/core/tokens/tokenPlayerAssignment.ts
```

Un token peut être lié à un joueur sans être ajouté au Stat Tracker.

Le sous-menu `Tactical GM Suite` permet :

```text
Ajouter/Retirer du Stat Tracker
Lié à personne / Lié à <joueur>
```

Stats utilise cette assignation pour ses permissions et garde un miroir temporaire dans le profil.

Voir `docs/TOKEN_PLAYER_ASSIGNMENT.md`.

## 6. Réglages de room Stats

Service :

```text
src/features/stats/services/statRoomSettings.ts
```

Version actuelle : `2`.

```ts
{
  allowPlayerConditions: boolean,
  tokenStatsPosition: "top" | "bottom"
}
```

Valeurs par défaut :

```text
allowPlayerConditions = false
tokenStatsPosition    = top
```

Seul le MJ peut modifier ces réglages.

## 7. Menu Stats rapide

Le Context Menu Stats est une interface de changement rapide.

Il ne contient pas :

- Modifier ;
- Supprimer ;
- Afficher/Masquer sur token.

Pour un joueur :

- le token doit lui être assigné ;
- seuls les trackers `canPlayerEdit = true` sont présentés.

Toujours distinguer :

```text
canPlayerEdit
visibility
showOnToken
```

## 8. Conditions — catalogue canonique

Assets :

```text
src/features/stats/assets/condition/Icon/
```

Catalogue :

```text
src/features/stats/services/statConditionCatalog.ts
```

Contenu :

```text
DND5E   -> 15
PF2E    -> 42
GENERIC -> 0 actuellement
```

Le runtime n’utilise plus l’ancien catalogue ni les aliases de transition.

## 9. Conditions — interaction

Flux :

```text
clic droit token
→ Conditions
→ recherche / liste
→ activation, désactivation ou édition
```

Comportements :

- liste triée alphabétiquement selon la langue active ;
- plusieurs conditions simultanées ;
- modification d’une condition active sans toucher aux autres ;
- hover sur icône/texte utile, pas sur toute la largeur vide ;
- hover avec Description + Résumé règles du système actif ;
- durées Manuelle/Rounds/Rencontre/Repos.

L’accès joueur au menu Conditions est contrôlé par `allowPlayerConditions` et reste désactivé par défaut.

## 10. Conditions dérivées

Voir `CONDITION_DERIVATIONS.md`.

Deux modes :

```text
while-active
on-apply
```

`while-active` maintient la condition secondaire tant que la source existe.

`on-apply` ajoute la condition au moment de l’activation puis la laisse devenir indépendante.

Les cas circonstanciels restent manuels.

## 11. Overlay Conditions

Principe non négociable :

```text
Stats      -> token.trackers   -> Stat Dock
Conditions -> token.conditions -> badges Conditions
```

Les deux overlays ont services, métadonnées et triggers distincts.

Géométrie Conditions :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Resize :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Aucun niveau n’est imprimé sur le badge.

## 12. Préchargement

Le background précharge les PNG dès que Owlbear est prêt :

1. Conditions ;
2. Trackers ;
3. concurrence limitée.

Le Stat Dock peut ensuite être reconstruit depuis les profils embarqués pour éviter qu’un overlay incomplet reste affiché.

---

# 13. Stat Dock — direction visuelle

Document de référence : `STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`.

Le Stat Dock est une zone unique au-dessus ou au-dessous du token.

Règles :

- pas de cercle ;
- pas de contrôles interactifs ;
- tous les trackers visibles dans une même zone logique ;
- position `top` ou `bottom` ;
- échelle liée à la taille réelle du token ;
- les proportions internes ne doivent pas varier avec le zoom.

Mapping :

| Type technique | Rendu token |
|---|---|
| `readonly` | Valeur simple |
| `counter` | Valeur simple |
| `toggle` | Icône + nom, couleur/désaturation |
| `bar` | Icône + nom + current/max + barre |
| `icon` | Répétition d’unités actives/inactives |

## 14. Assets du Stat Dock

```text
public/assets/stats/stat-plate.svg
public/assets/stats/stat-plate-muted.svg
public/assets/stats/stat-unit.svg
public/assets/stats/stat-unit-muted.svg
```

Les icônes métier restent les PNG du registre Stats.

## 15. Renderer actif

Entrée publique :

```text
src/features/stats/services/statTokenOverlayObrSync.ts
```

Renderer actif :

```text
statTokenOverlayObrSyncV17
```

État réel : **V17.1**.

V17.1 réutilise la création V12 et ne modifie jamais les objets `Text` après leur ajout à la scène.

Motif : les tests Owlbear ont montré qu’un `Text` de scène peut disparaître si son layer ou son zIndex est modifié après création.

L’empilement est obtenu en mettant uniquement les objets graphiques derrière le texte natif :

```text
Text natif       zIndex 0, non muté
mute shape       zIndex -5
icône PNG        zIndex -10
shape/barre      zIndex -20
plaque SVG       zIndex -30
```

Tout reste sur `ATTACHMENT`.

## 16. Historique des essais renderer

Les itérations V12→V17 ont isolé plusieurs comportements importants :

- les `Label` sont visibles mais restent en screen-space ;
- un `Label` ne convient donc pas au Stat Dock, car son texte change de proportion au zoom par rapport au token ;
- `Text` suit bien l’espace scène ;
- déplacer un `Text` vers un autre layer l’a fait disparaître ;
- muter son zIndex après `addItems` l’a également fait disparaître dans les essais ;
- la géométrie des plaques/icônes est maintenant suffisamment proche de la direction validée pour arrêter les refontes structurelles.

## 17. État de validation au 5 septembre 2026

Le Stat Dock n’est **pas encore considéré comme final**.

À valider en room après V17.1 :

- texte visible ;
- texte qui suit exactement le zoom comme les plaques et le token ;
- aucun élément graphique au-dessus du texte ;
- token 0,5 / 1 / 2 / 3 cases ;
- position top/bottom ;
- audiences public/private/gm ;
- overflow `+N` ;
- plusieurs types de trackers sur le même token.

Le prochain travail doit être du **polish visuel**, uniquement après validation de cette base technique.

## 18. Accessibilité

- ne pas dépendre uniquement de la couleur ;
- conserver une valeur textuelle pour les trackers numériques ;
- toggle actif/inactif doit rester distinguable par saturation/contraste ;
- le niveau Conditions reste accessible dans le menu ;
- l’audio futur ne doit jamais être le seul feedback.

## 19. Références

- `PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/features/STATS_V2_SPEC.md`
- `docs/TOKEN_PLAYER_ASSIGNMENT.md`
- `docs/stats/STAT_TOKEN_OVERLAY_VISUAL_SPEC_V1.md`
- `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`
- `docs/stats/CONDITIONS_RUNTIME_SYNC.md`
- `docs/stats/CONDITION_DERIVATIONS.md`
- `src/features/stats/README.md`
- `src/features/stats/services/statTokenOverlayObrSyncV17.ts`
