# Tactical GM Suite — Icon Library V1

Document de référence pour la bibliothèque d’icônes du module **Stats / Stat Tracker**.

Emplacement recommandé dans le dépôt :

```txt
Tactical-GM-Suite/
  docs/
    stats/
      ICON_LIBRARY_V1.md
```

## 1. Objectif

Définir la bibliothèque d’icônes V1 utilisée par les trackers de stats.

Les icônes sont des ressources graphiques libres. Elles ne doivent pas imposer le sens de la stat.

Exemples :

- `Cœur` peut servir aux PV, au moral, à une relation, à une faveur, à une dette ou à autre chose.
- `Projectile` peut servir aux munitions, aux charges, à un piège, à une ressource abstraite ou à autre chose.
- `Bouclier` peut servir à une CA, une posture, une protection, un compteur ou autre chose.

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Style de catégories | thématiques fantasy |
| Nombre de catégories principales | 4 |
| Onglet rapide | Récents |
| Icône dans plusieurs catégories | Non, une icône appartient à une seule catégorie principale |
| Recherche V1 | Non |
| Navigation | Onglets + grille |
| Volume V1 | 48 icônes |
| Répartition | 4 catégories × 12 icônes |
| Usage des icônes | Libre, non verrouillé |
| Assets repris d’un autre addon | Interdit |
| Création des assets | Icônes originales à produire une par une |

## 3. Onglets du picker

| Onglet | Rôle |
|---|---|
| Récents | icônes utilisées récemment |
| Corps & Protection | vivant, blessure, défense, armure |
| Arcane & Combat | magie, énergie, attaque, danger |
| Ressources & Richesses | consommables, équipement, monnaie |
| Objets & Marques | mécanismes, pièges, marqueurs, compteurs |

L’onglet `Récents` est un raccourci d’usage. Il ne change pas la catégorie principale de l’icône.

## 4. Liste des 48 icônes V1

### Corps & Protection

| Nom visible | ID proposé |
|---|---|
| Cœur | `body_heart` |
| Cœur brisé | `body_broken_heart` |
| Goutte | `body_drop` |
| Crâne | `body_skull` |
| Os | `body_bone` |
| Soin | `body_heal_cross` |
| Bouclier | `body_shield` |
| Bouclier fissuré | `body_cracked_shield` |
| Casque | `body_helmet` |
| Armure | `body_armor` |
| Cadenas | `body_lock` |
| Rempart | `body_wall` |

### Arcane & Combat

| Nom visible | ID proposé |
|---|---|
| Rune | `arcane_rune` |
| Cristal | `arcane_crystal` |
| Étoile | `arcane_star` |
| Œil | `arcane_eye` |
| Portail | `arcane_portal` |
| Flamme | `arcane_flame` |
| Épée | `arcane_sword` |
| Arc | `arcane_bow` |
| Projectile | `arcane_projectile` |
| Cible | `arcane_target` |
| Explosion | `arcane_explosion` |
| Éclair | `arcane_lightning` |

### Ressources & Richesses

| Nom visible | ID proposé |
|---|---|
| Fiole | `resource_vial` |
| Sacoche | `resource_pouch` |
| Torche | `resource_torch` |
| Ration | `resource_ration` |
| Pomme | `resource_apple` |
| Outil | `resource_tool` |
| Pièce | `resource_coin` |
| Platine | `resource_platinum` |
| Or | `resource_gold` |
| Argent | `resource_silver` |
| Cuivre | `resource_copper` |
| Gemme | `resource_gem` |

### Objets & Marques

| Nom visible | ID proposé |
|---|---|
| Engrenage | `object_gear` |
| Clé | `object_key` |
| Bombe | `object_bomb` |
| Sablier | `object_hourglass` |
| Drapeau | `object_flag` |
| Sceau | `object_seal` |
| Cercle | `object_circle` |
| Losange | `object_diamond` |
| Carré | `object_square` |
| Point | `object_dot` |
| Flèche haut | `object_arrow_up` |
| Flèche bas | `object_arrow_down` |

## 5. Lot test validé

Avant de produire les 48 icônes, produire un lot test de 8 icônes pour valider le style global.

| Icône | Catégorie | ID proposé |
|---|---|---|
| Cœur | Corps & Protection | `body_heart` |
| Bouclier | Corps & Protection | `body_shield` |
| Rune | Arcane & Combat | `arcane_rune` |
| Épée | Arcane & Combat | `arcane_sword` |
| Fiole | Ressources & Richesses | `resource_vial` |
| Pièce | Ressources & Richesses | `resource_coin` |
| Engrenage | Objets & Marques | `object_gear` |
| Sablier | Objets & Marques | `object_hourglass` |

## 6. Direction artistique validée

Les icônes doivent être des icônes fantasy stylisées, proches d’un rendu jeu vidéo / inventaire RPG, mais originales et sans reprendre d’assets existants.

| Élément | Décision |
|---|---|
| Style général | fantasy stylisé / jeu vidéo |
| Niveau de réalisme | stylisé avec léger semi-réalisme |
| Forme | compacte, lisible, avec un peu d’irrégularité organique |
| Angle | légère vue 3/4 |
| Contours | visibles mais propres |
| Ombres | légères, pour donner du volume |
| Couleurs | colorées mais pas flashy |
| Fond intégré | aucun, fond transparent |
| Cohérence | style global commun + petites nuances par catégorie |
| Format source | 256×256 px |
| Format final | PNG transparent ou WebP transparent |
| Lisibilité cible | reconnaissable à 24–32 px dans le picker |

## 7. Règles graphiques

Chaque icône doit respecter les règles suivantes :

- silhouette très reconnaissable même en petit ;
- détails présents mais pas trop fins ;
- lumière cohérente sur toute la série ;
- ombre légère ou profondeur interne ;
- contour sombre ou contrasté, mais pas cartoon trop épais ;
- saturation moyenne à forte, sans effet fluo ;
- détourage propre sur fond transparent ;
- objet centré, occupant environ 75 à 85 % de l’image ;
- marge suffisante pour éviter que l’icône touche les bords ;
- même niveau de détail sur les 48 icônes.

## 8. Nuances par catégorie

Les catégories peuvent avoir une ambiance visuelle légère, sans imposer d’usage.

| Catégorie | Ambiance visuelle |
|---|---|
| Corps & Protection | organique, cuir, métal, rouge, os, acier |
| Arcane & Combat | énergie, magie, armes, feu, violet, bleu, rouge |
| Ressources & Richesses | objets utiles, consommables, pièces, matières chaudes |
| Objets & Marques | mécanique, symbolique, pièges, marqueurs, formes simples |

## 9. Règles d’interdiction

À éviter ou interdire :

- copier les icônes d’un autre addon ;
- reprendre directement un asset protégé ;
- reproduire exactement le style d’un pack connu ;
- utiliser des logos reconnaissables ;
- mettre un fond intégré derrière chaque icône ;
- faire des icônes trop détaillées pour une lecture en 24–32 px ;
- forcer une couleur unique par catégorie ;
- créer des icônes dont le nom visible impose un usage de stat.

## 10. Format technique recommandé

Structure d’assets recommandée :

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
```

Chaque icône doit avoir une entrée dans une bibliothèque technique, par exemple :

| Champ | Exemple |
|---|---|
| `iconId` | `body_heart` |
| `label` | `Cœur` |
| `categoryId` | `body` |
| `assetPath` | `/assets/icons/body/body_heart.png` |
| `supportsTint` | `false` |
| `fallbackIconId` | `object_circle` |

Pour les icônes illustrées, `supportsTint` doit être `false` par défaut.

## 11. Comportement du picker

| État UI | Rendu attendu |
|---|---|
| Normal | icône seule sur fond du panneau |
| Hover | cercle gris translucide derrière l’icône |
| Sélectionné | cercle plus marqué + contour ou accent violet |
| Focus clavier | contour net, accessible |
| Désactivé | opacité réduite |
| Icône manquante | fallback générique |

Le picker V1 utilise uniquement des onglets + une grille. Pas de recherche en V1.

## 12. Fiche partielle — Cœur

Décision déjà validée :

- forme : entre cœur classique et cœur organique / anatomique stylisé.

Décisions encore à valider :

- état visuel : sain / dramatique / neutre énergique ;
- texture : lisse / légèrement organique / très texturée ;
- couleurs : rouge vif / bordeaux / mix rouge vif + ombres bordeaux ;
- détails : reflet, pulsation suggérée, fissure, contour sombre.

Recommandation actuelle :

- état visuel : neutre mais énergique ;
- texture : légèrement organique ;
- couleurs : rouge vif + ombres bordeaux ;
- reflet : oui ;
- pulsation suggérée : oui ;
- fissure : non ;
- contour sombre : oui.

