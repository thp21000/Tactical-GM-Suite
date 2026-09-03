# Conditions — runtime, cache et overlays

> Mise à jour : 3 septembre 2026.

Ce document décrit les règles runtime introduites après la migration vers le catalogue canonique des Conditions.

## Préchargement des PNG

Le background permanent Owlbear lance `preloadStatPngAssets()` dès `OBR.onReady`.

Le préchargement :

- ne bloque jamais l'enregistrement des Context Menus ;
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

## Séparation Stats / Conditions

L'overlay Stats et l'overlay Conditions sont deux systèmes indépendants.

Une modification de Condition ne doit jamais déclencher une création ou une mise à jour de l'overlay Stats.

`hooks/useStatTokenOverlayAutoSync.ts` ne synchronise donc que les trackers Stats. Il compare une signature construite uniquement à partir des trackers et ignore les changements qui ne concernent que `token.conditions` ou le timestamp global du profil.

Conditions possède son propre chemin :

```text
menu Conditions
→ profil embarqué
→ statConditionOverlayObrSync
```

Les changements de durée liés à Initiative passent également directement par le service d'overlay Conditions.

## Géométrie Conditions

`services/statConditionOverlayAutoSync.ts` tourne dans le background permanent.

La position des badges suit le token grâce aux attachments Owlbear. Le service ne resynchronise la géométrie que lorsqu'un token est redimensionné afin de recalculer le rayon de la couronne.

Paramètres visuels actuels :

```text
BADGE_SCALE = 0.088
RING_CENTER_X_OFFSET_RATIO = -0.035
MAX_BADGES_PER_RING = 12
```

Le décalage horizontal est une petite correction visuelle vers la gauche basée sur le rendu réel de la couronne Owlbear observé en room.

## Invariants

- plusieurs Conditions peuvent être actives simultanément ;
- modifier une Condition ne modifie pas les autres ;
- retirer un token du Stat Tracker ne doit pas supprimer ses Conditions ;
- supprimer ou recréer l'overlay Stats ne doit pas toucher aux badges Conditions ;
- les Conditions restent utilisables sur un token non suivi par le Stat Tracker.
