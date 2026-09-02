# INDEX_48_PROMPTS_ICONES

Bibliothèque **de base** des 48 prompts mono-icône du Stat Tracker de Tactical GM Suite.

Statut au 2 septembre 2026 :

- 48 IDs de base ;
- 4 catégories ;
- 12 sujets par catégorie ;
- les prompts individuels sont des payloads autonomes de génération ;
- les 15 ajouts ultérieurs sont listés séparément dans `INDEX_EXTRA_PROMPTS_ICONES_V2.md`.

Le registre runtime charge les PNG réellement présents dans `src/features/stats/assets/icons/` et associe des labels/couleurs d’accent aux IDs connus.

| Catégorie | Nom visible | ID technique | Fichier |
|---|---|---|---|
| body | Cœur | `body_heart` | `body/body_heart.md` |
| body | Cœur brisé | `body_broken_heart` | `body/body_broken_heart.md` |
| body | Goutte | `body_drop` | `body/body_drop.md` |
| body | Crâne | `body_skull` | `body/body_skull.md` |
| body | Os | `body_bone` | `body/body_bone.md` |
| body | Soin | `body_heal_cross` | `body/body_heal_cross.md` |
| body | Bouclier | `body_shield` | `body/body_shield.md` |
| body | Bouclier fissuré | `body_cracked_shield` | `body/body_cracked_shield.md` |
| body | Casque | `body_helmet` | `body/body_helmet.md` |
| body | Armure | `body_armor` | `body/body_armor.md` |
| body | Cadenas | `body_lock` | `body/body_lock.md` |
| body | Rempart | `body_wall` | `body/body_wall.md` |
| arcane | Rune | `arcane_rune` | `arcane/arcane_rune.md` |
| arcane | Cristal | `arcane_crystal` | `arcane/arcane_crystal.md` |
| arcane | Étoile | `arcane_star` | `arcane/arcane_star.md` |
| arcane | Œil | `arcane_eye` | `arcane/arcane_eye.md` |
| arcane | Portail | `arcane_portal` | `arcane/arcane_portal.md` |
| arcane | Flamme | `arcane_flame` | `arcane/arcane_flame.md` |
| arcane | Épée | `arcane_sword` | `arcane/arcane_sword.md` |
| arcane | Arc | `arcane_bow` | `arcane/arcane_bow.md` |
| arcane | Projectile | `arcane_projectile` | `arcane/arcane_projectile.md` |
| arcane | Cible | `arcane_target` | `arcane/arcane_target.md` |
| arcane | Explosion | `arcane_explosion` | `arcane/arcane_explosion.md` |
| arcane | Éclair | `arcane_lightning` | `arcane/arcane_lightning.md` |
| resource | Fiole | `resource_vial` | `resource/resource_vial.md` |
| resource | Sacoche | `resource_pouch` | `resource/resource_pouch.md` |
| resource | Torche | `resource_torch` | `resource/resource_torch.md` |
| resource | Ration | `resource_ration` | `resource/resource_ration.md` |
| resource | Pomme | `resource_apple` | `resource/resource_apple.md` |
| resource | Outil | `resource_tool` | `resource/resource_tool.md` |
| resource | Pièce | `resource_coin` | `resource/resource_coin.md` |
| resource | Platine | `resource_platinum` | `resource/resource_platinum.md` |
| resource | Or | `resource_gold` | `resource/resource_gold.md` |
| resource | Argent | `resource_silver` | `resource/resource_silver.md` |
| resource | Cuivre | `resource_copper` | `resource/resource_copper.md` |
| resource | Gemme | `resource_gem` | `resource/resource_gem.md` |
| object | Engrenage | `object_gear` | `object/object_gear.md` |
| object | Clé | `object_key` | `object/object_key.md` |
| object | Bombe | `object_bomb` | `object/object_bomb.md` |
| object | Sablier | `object_hourglass` | `object/object_hourglass.md` |
| object | Drapeau | `object_flag` | `object/object_flag.md` |
| object | Sceau | `object_seal` | `object/object_seal.md` |
| object | Cercle | `object_circle` | `object/object_circle.md` |
| object | Losange | `object_diamond` | `object/object_diamond.md` |
| object | Carré | `object_square` | `object/object_square.md` |
| object | Point | `object_dot` | `object/object_dot.md` |
| object | Flèche haut | `object_arrow_up` | `object/object_arrow_up.md` |
| object | Flèche bas | `object_arrow_down` | `object/object_arrow_down.md` |

## Règles d’intégration

Nom du PNG final :

```text
<ID technique>.png
```

Exemple :

```text
body_heart.png
```

Le dossier runtime détermine la catégorie. Le nom du fichier détermine l’ID.

Le sens du tracker n’est jamais déduit de cet ID.
