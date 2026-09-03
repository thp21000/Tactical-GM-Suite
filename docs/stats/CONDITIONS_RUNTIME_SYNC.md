# Conditions — runtime, cache et overlays

> Mise à jour : **4 septembre 2026**.

Ce document décrit le runtime actuel des Conditions après la migration vers le catalogue canonique, la séparation stricte avec l’overlay Stats et les dernières passes de géométrie sur token.

## 1. Préchargement des PNG

Le background permanent Owlbear lance `preloadStatPngAssets()` dès `OBR.onReady`.

Le préchargement :

- ne bloque jamais l’enregistrement des Context Menus ;
- charge en priorité les PNG canoniques des Conditions ;
- charge ensuite les icônes PNG du Stat Tracker ;
- limite volontairement la concurrence à 4 images ;
- réutilise le cache HTTP du navigateur pour accélérer les popovers, sous-menus et overlays ouverts ensuite.

Fichiers concernés :

```text
src/features/stats/services/statAssetPreload.ts
src/features/stats/services/statConditionAssets.ts
src/features/stats/background/setupStatBackground.ts
```

## 2. Catalogue runtime canonique

Le runtime n’utilise plus l’ancien `statConditions.ts`.

Le catalogue actif est :

```text
src/features/stats/services/statConditionCatalog.ts
```

Contenu actuel :

```text
DND5E   -> 15 conditions
PF2E    -> 42 conditions
GENERIC -> 0 condition
```

Les IDs sont canoniques et partagés entre systèmes lorsqu’un concept est commun. Les règles restent toutefois spécifiques au système.

Les anciennes conditions et aliases historiques ne sont plus migrés : une entrée inconnue du catalogue canonique n’est pas conservée par le runtime actuel.

## 3. Liste Conditions

La liste du sous-menu est triée par ordre alphabétique selon le libellé traduit dans la langue active.

Une condition active reste identifiable dans la liste et peut :

- être désactivée ;
- être modifiée via l’action d’édition ;
- conserver son niveau/sa valeur, sa durée et sa visibilité sans modifier les autres conditions actives.

Invariant : plusieurs conditions peuvent être actives simultanément sur le même token.

## 4. Hover Description / Résumé règles

Le sous-menu affiche une carte d’information au survol.

Cette carte :

- s’ancre directement à la ligne survolée ;
- se place au-dessus lorsque l’espace le permet ;
- peut basculer sous la ligne pour éviter d’être coupée dans les premières entrées ;
- affiche la **Description** ;
- affiche le **Résumé règles** du système actuellement sélectionné ;
- utilise la langue globale active.

Les textes localisés sont dans :

```text
src/features/stats/i18n/conditions.fr.ts
src/features/stats/i18n/conditions.en.ts
```

## 5. Séparation Stats / Conditions

L’overlay Stats et l’overlay Conditions sont deux systèmes indépendants.

Une modification de Condition ne doit jamais déclencher une création ou une mise à jour de l’overlay Stats.

`hooks/useStatTokenOverlayAutoSync.ts` ne synchronise que les trackers Stats. Il ignore les changements qui ne concernent que `token.conditions`.

Conditions possède son propre chemin :

```text
menu Conditions
→ profil embarqué
→ statConditionOverlayObrSync
```

Les changements de durée liés à Initiative passent également directement par le service d’overlay Conditions.

## 6. Auto-sync géométrique Conditions

`services/statConditionOverlayAutoSync.ts` tourne dans le background permanent.

La position attachée suit les déplacements du token via Owlbear. L’auto-sync surveille les changements de scale du token et relance le calcul de la couronne après redimensionnement.

Le service Conditions ne doit pas appeler l’écrivain d’overlay Stats.

## 7. Géométrie actuelle

Fichier principal :

```text
src/features/stats/services/statConditionOverlayObrSync.ts
```

Paramètres actuels :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
BADGE_RING_GAP = 1.08
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

Les offsets X/Y sont de petites corrections visuelles vers la gauche et le haut, validées sur le rendu réel Owlbear.

### Échelle proportionnelle au token

`BASE_BADGE_SCALE` représente la taille de référence pour un token occupant une case de grille.

L’échelle réelle est calculée avec la taille physique du token :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Conséquences attendues :

```text
token × 0,5 -> badges × 0,5
token × 1   -> badges à la taille de référence
token × 2   -> badges × 2
```

Le diamètre de badge utilisé pour le rayon de la couronne est calculé avec cette même échelle. Taille, rayon et espacement restent donc proportionnels entre eux.

## 8. Niveau / valeur sur le token

Le niveau ou la valeur d’une condition n’est plus affiché sous forme de chiffre sur le token.

Le niveau reste dans les données et dans le menu Conditions, mais l’overlay de scène ne génère que le médaillon PNG.

Le lecteur de métadonnées tolère encore le rôle historique `level` uniquement afin qu’un sync puisse supprimer d’anciens labels déjà présents dans une room ; aucun nouveau label de niveau n’est créé.

## 9. Placement et ordre des badges

Les badges actifs sont disposés radialement.

- premier anneau : jusqu’à 12 conditions ;
- anneaux supplémentaires : espacés avec `BADGE_RING_GAP` ;
- l’ordre de placement sur la couronne reste stable selon l’ordre de création puis l’ID de condition ;
- le tri alphabétique concerne la liste du menu, pas l’ordre radial des badges existants.

Cette différence est volontaire : retrier la couronne à chaque changement de langue déplacerait visuellement toutes les conditions.

## 10. Audience

Chaque condition garde sa visibilité :

```text
public
private
gm
```

Les badges `public` sont écrits dans les items de scène partagés. Les badges non publics passent par la surface locale appropriée au MJ.

Cette audience est indépendante des permissions d’édition des trackers Stats.

## 11. Invariants

- plusieurs Conditions peuvent être actives simultanément ;
- ajouter une Condition ne désactive jamais les autres ;
- modifier une Condition ne modifie pas les autres ;
- retirer un token du Stat Tracker ne doit pas supprimer ses Conditions ;
- supprimer ou recréer l’overlay Stats ne doit pas toucher aux badges Conditions ;
- modifier une Condition ne doit pas réveiller l’overlay Stats ;
- les Conditions restent utilisables sur un token non suivi par le Stat Tracker ;
- les badges suivent proportionnellement les changements de taille du token ;
- le niveau reste consultable dans le menu mais n’est pas imprimé sur le token.

## 12. Tests terrain recommandés

Avant une nouvelle grosse évolution Conditions :

1. token 0,5 / 1 / 2 / 3 cases avec mêmes conditions ;
2. resize répété dans les deux sens ;
3. 1, 2, 4, 8, 12 et plus de 12 conditions ;
4. audiences `public/private/gm` ;
5. changement de scène ;
6. refresh complet sans ouvrir le popover ;
7. conditions sur token non suivi ;
8. Rounds/Rencontre avec Initiative ;
9. vérifier qu’une modification Conditions ne crée jamais l’overlay Stats.
