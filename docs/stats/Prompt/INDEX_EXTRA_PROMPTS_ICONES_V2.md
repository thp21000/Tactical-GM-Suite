# INDEX_EXTRA_PROMPTS_ICONES_V2

Bibliothèque additionnelle de prompts mono-icône autonomes.

Ces 15 sujets enrichissent la base de 48, pour un total documenté de **63 IDs connus**.

| Catégorie | Nom visible | ID technique | Fichier |
|---|---|---|---|
| resource | Lingot d’or | `resource_gold_ingot` | `resource/resource_gold_ingot.md` |
| resource | Lingot de fer | `resource_iron_ingot` | `resource/resource_iron_ingot.md` |
| resource | Lingot de cuivre | `resource_copper_ingot` | `resource/resource_copper_ingot.md` |
| resource | Rubis | `resource_ruby` | `resource/resource_ruby.md` |
| resource | Boîte à outils | `resource_toolbox` | `resource/resource_toolbox.md` |
| object | Corbeau | `object_raven` | `object/object_raven.md` |
| object | Masque | `object_mask` | `object/object_mask.md` |
| object | Pierres | `object_stones` | `object/object_stones.md` |
| arcane | Hache | `arcane_axe` | `arcane/arcane_axe.md` |
| resource | Bourse | `resource_money_bag` | `resource/resource_money_bag.md` |
| resource | Coffre | `resource_chest` | `resource/resource_chest.md` |
| arcane | Gelée | `arcane_slime` | `arcane/arcane_slime.md` |
| arcane | Boule de feu | `arcane_fireball` | `arcane/arcane_fireball.md` |
| arcane | Livre | `arcane_book` | `arcane/arcane_book.md` |
| resource | Feuille | `resource_leaf` | `resource/resource_leaf.md` |

## Statut runtime

`src/features/stats/services/statTrackerIcons.ts` contient actuellement des labels et couleurs d’accent pour ces 15 IDs en plus de la base V1.

Comme pour toute la bibliothèque, le renderer ne charge que les PNG réellement présents dans `src/features/stats/assets/icons/**`.

## Règle d’autonomie

Chaque prompt additionnel doit rester autonome.

La section `PRÉCISIONS SPÉCIFIQUES À CETTE ICÔNE` doit contenir assez d’informations pour refaire le sujet sans accès à l’image modèle d’origine.

Ne pas ajouter de références du type « comme l’image jointe » dans une version destinée à être réutilisée plus tard.
