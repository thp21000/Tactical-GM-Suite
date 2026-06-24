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

Prompt maître — Icônes Stats V1

Créer une icône fantasy stylisée originale pour une interface de jeu de rôle tactique.

L’icône doit représenter : [NOM DE L’ICÔNE].

Style général :
icône d’inventaire RPG fantasy, stylisée, lisible, compacte, légèrement semi-réaliste, avec volume doux, contour sombre propre, reflets modérés et ombres légères.

Composition :
une seule icône centrée, fond transparent, aucun cadre intégré, aucun disque de fond, aucune interface autour. L’objet doit occuper environ 75 à 85 % de l’image, avec une petite marge de sécurité sur les bords.

Rendu :
forme immédiatement reconnaissable, silhouette claire, détails modérés, pas de surcharge visuelle. L’icône doit rester lisible à petite taille, environ 24 à 32 px dans une interface.

Direction artistique :
légère vue 3/4, rendu fantasy jeu vidéo, couleurs riches mais non flashy, matière identifiable, lumière douce venant du haut gauche, ombre subtile pour donner de la profondeur.

Contraintes :
image carrée 256×256 px, fond transparent, pas de texte, pas de logo, pas de watermark, pas de personnage, pas de décor, pas de fond coloré, pas de style moderne plat, pas de réalisme photo, pas de copie d’asset existant.

L’icône doit être originale et cohérente avec une bibliothèque d’icônes fantasy pour un addon Owlbear Rodeo appelé Tactical GM Suite.


# Prompts individuels — Lot test Icônes Stats V1

## 01 — Cœur / `body_heart`

Créer une icône fantasy stylisée originale représentant un cœur.

Style inventaire RPG, légère vue 3/4, forme compacte et très lisible. Le cœur doit être entre un cœur classique et une forme légèrement organique, vivant mais non réaliste. Palette rouge vif avec ombres bordeaux, léger reflet sur le haut, texture organique discrète, volume doux, contour sombre propre.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : cœur anatomique réaliste, veines détaillées, sang, gore, fissure, entaille, cœur brisé, contour cartoon trop épais, forme trop plate.

Format carré 256×256 px, fond transparent.

## 02 — Bouclier / `body_shield`

Créer une icône fantasy stylisée originale représentant un bouclier.

Style inventaire RPG, légère vue 3/4, silhouette robuste, simple et protectrice. Bouclier médiéval/fantasy classique, en métal gris bleuté avec reflets argentés. Ajouter un contour sombre propre, un volume doux, une légère ombre, éventuellement une bosse centrale ou un renfort simple. L’objet doit paraître solide, fiable et lisible.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : blason complexe, héraldique chargée, fissures lourdes, dégâts importants, forme moderne, style trop réaliste, détails trop fins.

Format carré 256×256 px, fond transparent.

## 03 — Rune / `arcane_rune`

Créer une icône fantasy stylisée originale représentant une rune magique.

Style inventaire RPG, forme runique simple, anguleuse, mémorable et très lisible. La rune doit évoquer une magie ancienne et active, avec un aspect pierre gravée ou énergie cristallisée. Palette violet et bleu magique, léger relief, contour sombre propre, petit glow interne ou halo très discret, reflets modérés.

L’icône doit être centrée, fond transparent, sans cercle magique complet, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : glyphe trop complexe, traits trop fins, symbole confus, effet néon agressif, halo trop flou, surcharge de détails.

Format carré 256×256 px, fond transparent.

## 04 — Épée / `arcane_sword`

Créer une icône fantasy stylisée originale représentant une épée.

Style inventaire RPG, légère vue 3/4, silhouette longue, claire et héroïque. Épée simple et classique, lame en acier argenté avec reflets doux, poignée sobre en cuir brun ou métal foncé, garde simple. Contour sombre propre, volume doux, ombre légère. L’arme doit évoquer le combat et la maîtrise sans être trop agressive.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : sang, rouille excessive, arme cassée, décorations trop complexes, épée trop massive, style cartoon, silhouette confuse avec une dague ou une lance.

Format carré 256×256 px, fond transparent.

## 05 — Fiole / `resource_vial`

Créer une icône fantasy stylisée originale représentant une fiole.

Style inventaire RPG, légère vue 3/4, petite fiole compacte et lisible. Flacon en verre clair avec un liquide coloré visible à l’intérieur, palette vert, bleu ou violet alchimique, bouchon simple en liège ou matériau sombre. Ajouter des reflets doux sur le verre, un léger dégradé dans le liquide, une petite bulle discrète si lisible, contour sombre propre.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : fiole trop fine, liquide qui déborde, étiquette détaillée, symbole minuscule, verre trop transparent, forme trop complexe.

Format carré 256×256 px, fond transparent.

## 06 — Pièce / `resource_coin`

Créer une icône fantasy stylisée originale représentant une pièce.

Style inventaire RPG, légère vue 3/4 ou pièce légèrement inclinée, silhouette ronde ou légèrement irrégulière. Pièce métallique dorée générique, palette or chaud avec ombres brun/orange, bord légèrement épais, petit relief simple au centre comme une marque abstraite, une petite rune ou une étoile très simple. Reflets chauds, contour sombre propre, volume doux.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte lisible, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : visage, emblème reconnaissable, texte gravé, pile de pièces, rendu trop plat, brillance plastique, symbole trop précis.

Format carré 256×256 px, fond transparent.

## 07 — Engrenage / `object_gear`

Créer une icône fantasy stylisée originale représentant un engrenage.

Style inventaire RPG, légère vue 3/4, engrenage compact, robuste et immédiatement reconnaissable. Cercle denté avec dents larges et bien séparées, trou central lisible, métal ancien gris acier ou brun métallique, reflets froids modérés, petites marques d’usure discrètes, contour sombre propre, volume doux.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : dents trop nombreuses ou trop fines, engrenage industriel moderne, rouille excessive, plusieurs rouages, mécanisme complexe, détails internes minuscules.

Format carré 256×256 px, fond transparent.

## 08 — Sablier / `object_hourglass`

Créer une icône fantasy stylisée originale représentant un sablier.

Style inventaire RPG, légère vue 3/4, sablier compact et élégant. Silhouette claire avec deux ampoules de verre, cadre simple en bois brun ou métal sombre, sable doré visible dans les deux parties, mince filet de sable central si lisible. Ajouter de légers reflets sur le verre, un contour sombre propre, un volume doux et une ombre légère.

L’icône doit être centrée, fond transparent, sans cadre, sans disque de fond, sans texte, sans logo, sans décor. Elle doit rester immédiatement reconnaissable à 24–32 px.

Éviter : cadre trop complexe, verre trop transparent, sable trop détaillé, chiffres, runes minuscules, effet magique trop fort, sablier trop fin.

Format carré 256×256 px, fond transparent.
