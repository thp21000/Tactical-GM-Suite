# Tactical GM Suite — Icon Asset Integration V1

Document opérationnel pour intégrer les assets d’icônes du module Stats.

Emplacement recommandé :

```txt
Tactical-GM-Suite/docs/stats/ICON_ASSET_INTEGRATION_V1.md
```

## 1. Objectif

Décrire comment préparer, vérifier, nommer et intégrer les icônes du Stat Tracker.

Ce document concerne d’abord le lot test :

- 8 icônes validées visuellement ;
- 1 icône fallback recommandée : `object_circle`.

## 2. Lot d’intégration V1 test

| Nom visible | ID | Fichier attendu | Catégorie | Rôle |
|---|---|---|---|---|
| Cœur | `body_heart` | `body_heart.png` | `body` | icône test |
| Bouclier | `body_shield` | `body_shield.png` | `body` | icône test |
| Rune | `arcane_rune` | `arcane_rune.png` | `arcane` | icône test |
| Épée | `arcane_sword` | `arcane_sword.png` | `arcane` | icône test |
| Fiole | `resource_vial` | `resource_vial.png` | `resource` | icône test |
| Pièce | `resource_coin` | `resource_coin.png` | `resource` | icône test |
| Engrenage | `object_gear` | `object_gear.png` | `object` | icône test |
| Sablier | `object_hourglass` | `object_hourglass.png` | `object` | icône test |
| Cercle | `object_circle` | `object_circle.png` | `object` | fallback technique |

## 3. Emplacement dans le repo

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

Ne pas mettre ces assets dans `public/` sauf si l’architecture réelle du projet l’impose.

## 4. Règles de nommage

| Règle | Exemple |
|---|---|
| nom en anglais technique | `body_heart.png` |
| tout en minuscule | oui |
| séparateur `_` | oui |
| pas d’espace | oui |
| pas d’accent | oui |
| pas de nom généré automatiquement | éviter `imagegen.png` |
| préfixe de catégorie | `body_`, `arcane_`, `resource_`, `object_` |

Le `iconId` doit être identique au nom du fichier sans extension.

## 5. Vérification de vraie transparence

Chaque icône doit avoir un canal alpha réel.

Une image invalide peut avoir l’air transparente parce qu’elle contient un damier gris/blanc, mais ce damier peut être peint dans l’image.

Tests obligatoires :

| Test | Résultat attendu |
|---|---|
| affichage sur fond sombre | aucun carré visible |
| affichage sur fond clair | aucun carré visible |
| inspection alpha | zones extérieures réellement transparentes |
| bord de l’icône | pas de halo blanc sale |
| damier | jamais dessiné dans l’image |

Exemple de script Python de vérification :

```py
from pathlib import Path
from PIL import Image

for path in Path("src/features/stats/assets/icons").rglob("*.png"):
    img = Image.open(path).convert("RGBA")
    alpha = img.getchannel("A")
    min_alpha, max_alpha = alpha.getextrema()
    print(path, "alpha range:", min_alpha, max_alpha)

    if min_alpha == 255:
        print("  WARNING: image is fully opaque, background is not transparent")
```

Une icône avec `min_alpha == 255` est entièrement opaque : elle n’a pas de vraie transparence.

## 6. Taille et format

| Élément | Recommandation |
|---|---|
| taille finale repo | 256×256 px |
| format | PNG transparent |
| ratio | 1:1 |
| fond | alpha transparent |
| poids cible | idéalement inférieur à 150–250 Ko par icône si possible |

Si une image générée est plus grande, la redimensionner proprement en 256×256 avant intégration.

## 7. Critères de validation visuelle

| Critère | Accepté si… |
|---|---|
| silhouette | l’objet est reconnaissable immédiatement |
| lisibilité 32 px | l’icône reste claire |
| lisibilité 24 px | l’icône reste identifiable |
| style | fantasy RPG, pas flat moderne |
| détails | présents mais pas trop fins |
| couleurs | riches mais pas flashy |
| contour | visible, propre |
| fond | totalement transparent |
| cohérence | même niveau de finition que les autres |
| usage libre | aucun texte ou symbole imposant une stat |

## 8. Déclaration dans le code

Créer ou compléter :

```txt
src/features/stats/design/iconCategories.ts
src/features/stats/design/iconLibrary.ts
```

Structure conceptuelle d’une icône :

```ts
{
  iconId: "body_heart",
  label: "Cœur",
  categoryId: "body",
  assetPath: bodyHeartIcon,
  supportsTint: false
}
```

Structure conceptuelle d’une catégorie :

```ts
{
  categoryId: "body",
  label: "Corps & Protection",
  iconId: "body_shield"
}
```

`recent` n’est pas une vraie catégorie d’asset : c’est un onglet dynamique dans le picker.

## 9. Fallback

Fallback recommandé :

```txt
object_circle
```

Règles :

| Problème | Comportement |
|---|---|
| `iconId` vide | afficher `object_circle` |
| `iconId` inconnu | afficher `object_circle` |
| image absente | afficher `object_circle` |
| erreur de chargement | afficher `object_circle` |
| catégorie inconnue | ne pas afficher l’icône dans la grille, mais fallback dans le tracker |
| icône récente supprimée | l’ignorer dans les récents |

Le fallback est uniquement technique. Il ne doit jamais remplacer un choix jugé illogique.

## 10. Ne pas casser l’existant

| Élément existant | Comportement attendu |
|---|---|
| tracker avec `iconId` existant | essayer de l’afficher |
| tracker sans `iconId` | fallback |
| tracker avec ancien `iconId` inconnu | fallback |
| tracker avec `visualType` existant | inchangé |
| tracker avec `skinId` absent | `neutral` |
| presets existants | peuvent être enrichis, mais pas cassés |
| données sauvegardées | migration douce ou fallback |

Aucune donnée utilisateur ne doit disparaître à cause de cette intégration.

## 11. Ce que Codex ne doit pas faire

Interdits :

- associer automatiquement une icône à une stat ;
- remplacer un visualType choisi par l’utilisateur ;
- recolorer automatiquement les PNG selon le skin ;
- déplacer les assets dans `public/` sans raison ;
- coder les icônes directement dans le picker ;
- dupliquer les icônes dans plusieurs catégories ;
- supprimer les anciens champs tracker ;
- créer une recherche/favoris complexe en V1.

## 12. Checklist avant intégration

| À faire | Statut |
|---|---|
| 8 icônes test générées | fait |
| vraie transparence vérifiée | à vérifier fichier par fichier |
| fichiers renommés proprement | à faire |
| fichiers redimensionnés en 256×256 | à faire si nécessaire |
| `object_circle` validé | à faire |
| dossier assets créé | à faire |
| `iconLibrary.ts` prévu | oui |
| `iconCategories.ts` prévu | oui |
| fallback défini | oui, `object_circle` |
| docs à jour | ce document |

## 13. Ordre d’intégration recommandé

1. Préparer les fichiers PNG transparents.
2. Renommer selon les `iconId`.
3. Redimensionner en 256×256 si nécessaire.
4. Placer dans `src/features/stats/assets/icons/`.
5. Créer ou compléter `iconCategories.ts`.
6. Créer ou compléter `iconLibrary.ts`.
7. Brancher le picker sur la bibliothèque.
8. Ajouter le fallback `object_circle`.
9. Tester création / édition de tracker.
10. Tester trackers existants.
11. Lancer le build TypeScript.
