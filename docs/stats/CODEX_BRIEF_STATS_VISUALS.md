# Tactical GM Suite — Codex Brief: Stats Visual Design System

Document court à donner à Codex pour implémenter ou modifier le système visuel du module Stats.

Emplacement recommandé dans le dépôt :

```txt
Tactical-GM-Suite/
  docs/
    stats/
      CODEX_BRIEF_STATS_VISUALS.md
```

## 1. But

Implémenter progressivement un design system pour les trackers du module Stats / Stat Tracker.

Le système doit rester compatible avec l’architecture actuelle et ne doit pas verrouiller les choix du MJ.

## 2. Règle absolue

Ne jamais associer obligatoirement une icône à une stat.

Les icônes sont des ressources graphiques libres. Les presets peuvent proposer une configuration cohérente, mais tout doit rester modifiable par le MJ.

Exemples autorisés :

- cœur utilisé pour autre chose que les PV ;
- bouclier utilisé pour autre chose que la CA ;
- projectile utilisé pour autre chose que les munitions ;
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
- blocage sémantique d’une configuration utilisateur.

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

## 6. Bibliothèque d’icônes V1

Créer ou prévoir une bibliothèque de 48 icônes réparties en 4 catégories :

- `body` : Corps & Protection ;
- `arcane` : Arcane & Combat ;
- `resource` : Ressources & Richesses ;
- `object` : Objets & Marques.

Ajouter aussi un onglet UI `Récents`, qui ne change pas la catégorie principale de l’icône.

Une icône appartient à une seule catégorie principale.

## 7. Liste des icônes V1

### body

- `body_heart` — Cœur
- `body_broken_heart` — Cœur brisé
- `body_drop` — Goutte
- `body_skull` — Crâne
- `body_bone` — Os
- `body_heal_cross` — Soin
- `body_shield` — Bouclier
- `body_cracked_shield` — Bouclier fissuré
- `body_helmet` — Casque
- `body_armor` — Armure
- `body_lock` — Cadenas
- `body_wall` — Rempart

### arcane

- `arcane_rune` — Rune
- `arcane_crystal` — Cristal
- `arcane_star` — Étoile
- `arcane_eye` — Œil
- `arcane_portal` — Portail
- `arcane_flame` — Flamme
- `arcane_sword` — Épée
- `arcane_bow` — Arc
- `arcane_projectile` — Projectile
- `arcane_target` — Cible
- `arcane_explosion` — Explosion
- `arcane_lightning` — Éclair

### resource

- `resource_vial` — Fiole
- `resource_pouch` — Sacoche
- `resource_torch` — Torche
- `resource_ration` — Ration
- `resource_apple` — Pomme
- `resource_tool` — Outil
- `resource_coin` — Pièce
- `resource_platinum` — Platine
- `resource_gold` — Or
- `resource_silver` — Argent
- `resource_copper` — Cuivre
- `resource_gem` — Gemme

### object

- `object_gear` — Engrenage
- `object_key` — Clé
- `object_bomb` — Bombe
- `object_hourglass` — Sablier
- `object_flag` — Drapeau
- `object_seal` — Sceau
- `object_circle` — Cercle
- `object_diamond` — Losange
- `object_square` — Carré
- `object_dot` — Point
- `object_arrow_up` — Flèche haut
- `object_arrow_down` — Flèche bas

## 8. Lot test prioritaire

Avant les 48 icônes, produire ou intégrer 8 icônes test :

- `body_heart`
- `body_shield`
- `arcane_rune`
- `arcane_sword`
- `resource_vial`
- `resource_coin`
- `object_gear`
- `object_hourglass`

## 9. Direction artistique des icônes

Les icônes doivent être originales, non copiées depuis un autre addon.

Style validé :

- fantasy stylisé / jeu vidéo ;
- léger semi-réalisme ;
- légère vue 3/4 ;
- contours visibles mais propres ;
- ombres légères ;
- couleurs lisibles mais non flashy ;
- fond transparent ;
- format source 256×256 px ;
- format final PNG ou WebP transparent ;
- lisible à 24–32 px.

Ne pas intégrer de disque ou plaque de fond dans les icônes : le fond, la sélection, le hover et le skin doivent être gérés par l’UI.

## 10. Structure recommandée

```txt
src/features/stats/
  design/
    iconLibrary.ts
    iconCategories.ts
    trackerSkins.ts
    visualTypes.ts
    trackerStates.ts
    trackerFallbacks.ts

  components/
    StatTrackerRenderer.tsx
    StatIconPicker.tsx
    StatSkinPicker.tsx
    StatPreview.tsx

  components/renderers/
    IconTrackerRenderer.tsx
    BarTrackerRenderer.tsx
    CounterTrackerRenderer.tsx
    ReadonlyTrackerRenderer.tsx
    ToggleTrackerRenderer.tsx
    UnitsTrackerRenderer.tsx

  assets/icons/
    body/
    arcane/
    resource/
    object/

  styles/
    stat-trackers.css
    stat-skins.css
    stat-animations.css
```

## 11. Comportement du picker

Le picker V1 doit être simple : onglets + grille.

Onglets :

- Récents
- Corps & Protection
- Arcane & Combat
- Ressources & Richesses
- Objets & Marques

États UI :

- normal : icône seule ;
- hover : cercle gris translucide ;
- sélectionné : cercle plus marqué + accent violet ;
- focus clavier : contour clair ;
- icône manquante : fallback générique.

## 12. Skins

Les skins ne doivent pas recolorer obligatoirement l’icône. Pour les icônes illustrées, `supportsTint` est `false` par défaut.

Le skin agit plutôt sur :

- fond du tracker ;
- barre ;
- bordure ;
- halo ;
- badge ;
- état sélectionné ;
- texte ou accent UI.

Skins de base recommandés :

- `neutral`
- `red`
- `blue`
- `purple`
- `gold`
- `green`
- `orange`
- `steel`
- `dark`

## 13. Animations

Animations CSS légères recommandées :

- `value-pop`
- `increase-glow`
- `decrease-flash`
- `bar-transition`
- `unit-fill`
- `toggle-switch`
- `disabled-fade`

Respecter `prefers-reduced-motion`.

## 14. Implémentation par étapes

1. Ajouter ces documents de référence dans `docs/stats/`.
2. Créer les types et registres de design sans modifier la logique métier.
3. Créer la bibliothèque d’icônes V1 avec placeholders si besoin.
4. Ajouter le picker d’icônes par onglets.
5. Ajouter `skinId` optionnel avec fallback `neutral`.
6. Refactoriser les renderers pour les rendre génériques.
7. Ajouter `units` seulement si les autres types sont stables.
8. Ajouter l’aperçu live.
9. Ajouter les animations CSS.
10. Ajuster les presets pour préremplir sans verrouiller.

