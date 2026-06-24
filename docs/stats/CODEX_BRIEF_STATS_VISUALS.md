# Tactical GM Suite — Codex Brief: Stats Visuals

Document court à donner à Codex pour implémenter progressivement le design visuel du module Stats.

Emplacement recommandé :

```txt
Tactical-GM-Suite/docs/stats/CODEX_BRIEF_STATS_VISUALS.md
```

## 1. Objectif

Mettre en place progressivement un design system visuel pour les trackers Stats, sans casser le module existant.

Le travail concerne uniquement **Stats / Stat Tracker**.

Ne pas toucher aux modules Calendar, Loot Table, Initiative, Distance, Core sauf nécessité technique directe.

## 2. Règle absolue

Ne jamais associer obligatoirement une icône à une stat.

Les icônes sont des ressources graphiques libres. Les presets peuvent proposer une configuration cohérente, mais tout doit rester modifiable par le MJ.

Exemples autorisés :

- cœur utilisé pour autre chose que les PV ;
- bouclier utilisé pour autre chose que la CA ;
- projectile utilisé pour autre chose que les munitions ;
- pièce utilisée pour autre chose que de la monnaie ;
- `units` avec une valeur max élevée ;
- icône étrange avec visual type valide.

## 3. Interdictions importantes

Ne pas faire :

- `if name === "PV" then heart` ;
- `if name === "CA" then shield` ;
- `if icon === heart then only health-related types` ;
- `if visualType === units && max > X then bar` ;
- remplacement automatique d’un visual type valide ;
- regroupement automatique des unités ;
- blocage sémantique d’une configuration utilisateur ;
- recoloration automatique destructive des PNG illustrés ;
- suppression ou migration risquée des anciens trackers.

Les seuls fallbacks autorisés sont techniques : icône introuvable, skin introuvable, type inconnu ou données obligatoires manquantes.

## 4. Visual types

Le système doit supporter les visual types suivants :

- `icon`
- `bar`
- `counter`
- `readonly`
- `toggle`
- `units`

Chaque visual type doit être générique.

`units` signifie : répéter l’icône choisie par l’utilisateur selon `current` et `max`. Cela ne signifie pas “cœurs”.

## 5. Données de tracker actuelles

Les trackers peuvent contenir :

- `name`
- `visualType`
- `iconId`
- `current`
- `max`
- `value`
- `enabled`
- `visibility`
- `canPlayerEdit`
- `showOnToken`

Ajout recommandé :

- `skinId`, optionnel, fallback `neutral`.

Ne pas rendre `statId` obligatoire pour le design visuel.

## 6. Bibliothèque d’icônes V1

Créer ou prévoir une bibliothèque de 48 icônes réparties en 4 catégories :

- `body` : Corps & Protection ;
- `arcane` : Arcane & Combat ;
- `resource` : Ressources & Richesses ;
- `object` : Objets & Marques.

Ajouter aussi un onglet UI `Récents`, qui ne change pas la catégorie principale de l’icône.

Une icône appartient à une seule catégorie principale.

## 7. Lot test prioritaire

Intégrer d’abord le lot test suivant :

- `body_heart`
- `body_shield`
- `arcane_rune`
- `arcane_sword`
- `resource_vial`
- `resource_coin`
- `object_gear`
- `object_hourglass`
- `object_circle` comme fallback technique si validé.

Ces assets doivent être de vrais PNG transparents. Ne pas intégrer une image avec un damier dessiné en fond.

## 8. Emplacement des assets

```txt
src/features/stats/assets/icons/
  body/
    body_heart.png
    body_shield.png

  arcane/
    arcane_rune.png
    arcane_sword.png

  resource/
    resource_vial.png
    resource_coin.png

  object/
    object_gear.png
    object_hourglass.png
    object_circle.png
```

Ne pas déplacer les assets dans `public/` sauf si l’architecture réelle du repo l’impose déjà.

## 9. Fichiers techniques recommandés

```txt
src/features/stats/design/iconCategories.ts
src/features/stats/design/iconLibrary.ts
src/features/stats/design/trackerSkins.ts
src/features/stats/components/StatIconPicker.tsx
src/features/stats/components/StatSkinPicker.tsx
src/features/stats/components/StatPreview.tsx
```

Si des composants équivalents existent déjà, les adapter plutôt que recréer des doublons.

## 10. Picker d’icônes

Le picker doit :

- afficher 4 catégories + Récents ;
- utiliser une grille d’icônes ;
- ne pas avoir de recherche en V1 ;
- afficher une pastille au hover ;
- afficher une sélection claire ;
- proposer un fallback si l’icône manque ;
- ne jamais modifier le nom, le type, les valeurs ou le skin quand l’icône change.

## 11. Skins

Les skins sont des ambiances visuelles libres.

Skins V1 :

- `neutral`
- `red`
- `blue`
- `purple`
- `gold`
- `green`
- `orange`
- `steel`
- `dark`

Le fallback de skin est toujours `neutral`.

Les skins modifient le conteneur, la bordure, la barre, les badges, les boutons, le glow et les états. Ils ne recolorent pas automatiquement les PNG illustrés.

## 12. Aperçu live

Ajouter un aperçu live dans le formulaire de création/édition des trackers Stats.

L’aperçu doit utiliser le même renderer que les trackers réels, via un tracker temporaire construit depuis l’état du formulaire.

Il doit refléter :

- nom ;
- visualType ;
- valeurs ;
- icône ;
- skin.

Il ne doit jamais corriger automatiquement les choix du MJ.

En V1, l’aperçu concerne uniquement le rendu panel, pas le rendu token.

## 13. Ordre de travail recommandé

Lot 1 — Documentation + assets :

1. Ajouter / mettre à jour les fichiers dans `docs/stats/`.
2. Ajouter les icônes validées dans `src/features/stats/assets/icons/`.
3. Vérifier vraie transparence des PNG.
4. Ne pas modifier la logique fonctionnelle des trackers.

Lot 2 — Bibliothèque + picker :

1. Créer ou compléter `iconCategories.ts`.
2. Créer ou compléter `iconLibrary.ts`.
3. Brancher le picker sur cette bibliothèque.
4. Ajouter le fallback `object_circle`.
5. Préserver tous les trackers existants.

Lot 3 — Skins + aperçu live :

1. Ajouter `trackerSkins.ts` et CSS variables associées.
2. Ajouter / adapter le choix de skin dans le formulaire.
3. Ajouter `StatPreview`.
4. Brancher l’aperçu sur le vrai renderer.
5. Tester `icon`, `bar`, `counter`, `readonly`, `toggle`, `units`.

## 14. Tests minimum

À la fin de chaque lot :

- `npm run build`
- `npm run lint` si disponible
- vérifier que les trackers existants s’affichent encore ;
- créer un tracker custom avec une icône libre ;
- vérifier qu’un tracker sans `iconId` utilise le fallback ;
- vérifier qu’un tracker sans `skinId` utilise `neutral`.
