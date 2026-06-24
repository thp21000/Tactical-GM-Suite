# Tactical GM Suite — Icon Library V1

Document de référence pour la bibliothèque d’icônes du module **Stats / Stat Tracker**.

Emplacement recommandé :

```txt
Tactical-GM-Suite/docs/stats/ICON_LIBRARY_V1.md
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

Lot test prioritaire pour valider le style graphique avant de produire les 48 icônes.

| Icône | Catégorie | ID proposé | Statut |
|---|---|---|---|
| Cœur | Corps & Protection | `body_heart` | généré et à intégrer si transparence vérifiée |
| Bouclier | Corps & Protection | `body_shield` | généré et à intégrer si transparence vérifiée |
| Rune | Arcane & Combat | `arcane_rune` | généré et à intégrer si transparence vérifiée |
| Épée | Arcane & Combat | `arcane_sword` | généré et à intégrer si transparence vérifiée |
| Fiole | Ressources & Richesses | `resource_vial` | généré et à intégrer si transparence vérifiée |
| Pièce | Ressources & Richesses | `resource_coin` | généré et à intégrer si transparence vérifiée |
| Engrenage | Objets & Marques | `object_gear` | généré et à intégrer si transparence vérifiée |
| Sablier | Objets & Marques | `object_hourglass` | généré et à intégrer si transparence vérifiée |
| Cercle | Objets & Marques | `object_circle` | fallback technique recommandé, à valider |

`object_circle` fait partie des 48 icônes V1, mais il est prioritaire car il sert de fallback technique.

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
| Lisibilité cible | reconnaissable à 24–32 px |

## 7. Règles de style

Chaque icône doit avoir :

- une silhouette très reconnaissable même en petit ;
- des détails présents mais pas trop fins ;
- une lumière cohérente, idéalement venant du haut gauche ;
- une ombre légère ou une profondeur interne ;
- un contour sombre ou contrasté, propre mais pas cartoon épais ;
- une saturation moyenne à forte, sans effet fluo ;
- un détourage propre ;
- un objet centré, occupant environ 75 à 85 % de l’image ;
- une marge suffisante pour éviter que l’icône touche les bords ;
- le même niveau de détail sur toute la série.

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
- créer des icônes dont le nom visible impose un usage de stat ;
- générer une fausse transparence en damier peint.

## 10. Prompt maître de génération

```txt
Créer une icône fantasy stylisée originale pour une interface de jeu de rôle tactique.

L’icône doit représenter : [NOM DE L’ICÔNE].

Style général : icône d’inventaire RPG fantasy, stylisée, lisible, compacte, légèrement semi-réaliste, avec volume doux, contour sombre propre, reflets modérés et ombres légères.

Composition : une seule icône centrée, fond transparent, aucun cadre intégré, aucun disque de fond, aucune interface autour. L’objet doit occuper environ 75 à 85 % de l’image, avec une petite marge de sécurité sur les bords.

Rendu : forme immédiatement reconnaissable, silhouette claire, détails modérés, pas de surcharge visuelle. L’icône doit rester lisible à petite taille, environ 24 à 32 px dans une interface.

Direction artistique : légère vue 3/4, rendu fantasy jeu vidéo, couleurs riches mais non flashy, matière identifiable, lumière douce venant du haut gauche, ombre subtile pour donner de la profondeur.

Contraintes : image carrée 256×256 px, fond transparent, pas de texte, pas de logo, pas de watermark, pas de personnage, pas de décor, pas de fond coloré, pas de style moderne plat, pas de réalisme photo, pas de copie d’asset existant.

L’icône doit être originale et cohérente avec une bibliothèque d’icônes fantasy pour un addon Owlbear Rodeo appelé Tactical GM Suite.
```

## 11. Prompt négatif commun

```txt
À éviter : texte, logo, watermark, personnage, décor, fond coloré, cadre intégré, disque de fond, image photo-réaliste, style moderne plat, pictogramme trop simple, détails trop fins, contour cartoon trop épais, effet néon agressif, surcharge visuelle, objet coupé par les bords, icône illisible à petite taille, copie d’asset existant, fond en damier peint au lieu d’une vraie transparence.
```

## 12. Format technique recommandé

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
    object_circle.png
```

Chaque icône doit avoir une entrée dans une bibliothèque technique, par exemple :

| Champ | Exemple |
|---|---|
| `iconId` | `body_heart` |
| `label` | `Cœur` |
| `categoryId` | `body` |
| `assetPath` | import du PNG |
| `supportsTint` | `false` |

Pour les icônes illustrées V1, `supportsTint` doit être `false` par défaut.

## 13. Vérification de vraie transparence

Chaque icône doit avoir une vraie transparence alpha.

À vérifier :

- pas de carré blanc ;
- pas de fond gris ;
- pas de damier dessiné ;
- canal alpha réellement transparent autour de l’objet ;
- pas de halo blanc sale autour du détourage ;
- rendu propre sur fond sombre et fond clair.

Un damier visible dans l’image n’est pas une transparence. C’est une fausse transparence peinte dans l’image.
