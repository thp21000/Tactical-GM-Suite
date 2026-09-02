# README — Prompts d’icônes additionnels V2

Ce pack contient **15 prompts mono-icône additionnels** pour enrichir la bibliothèque Stats.

Ils s’ajoutent aux 48 sujets de base, soit **63 IDs documentés** au checkpoint du 2 septembre 2026.

## Différence avec les premiers essais

Ces prompts sont autonomes.

Ils ne supposent pas qu’un futur générateur aura encore accès aux images modèles utilisées pendant leur conception.

La section :

```text
PRÉCISIONS SPÉCIFIQUES À CETTE ICÔNE
```

décrit directement la forme, les matériaux, les couleurs et les éléments distinctifs à produire.

## Contenu

Ajouts explicitement demandés :

- Lingot d’or
- Lingot de fer
- Lingot de cuivre
- Rubis
- Boîte à outils

Sujets reconstruits depuis des références puis rendus autonomes :

- Corbeau
- Masque
- Pierres
- Hache
- Bourse
- Coffre
- Gelée
- Boule de feu
- Livre
- Feuille

## Utilisation recommandée

Pour chaque icône :

1. ouvrir idéalement un nouveau chat ;
2. joindre un seul fichier prompt ;
3. écrire `Suis ce prompt et seulement lui.` ;
4. produire une seule image ;
5. vérifier transparence, silhouette et lisibilité ;
6. enregistrer sous `<iconId>.png`.

## Intégration

Les IDs et fichiers sont listés dans :

```text
INDEX_EXTRA_PROMPTS_ICONES_V2.md
```

Les labels et couleurs d’accent correspondants sont déjà connus par le registre TypeScript actuel.

Le PNG doit être placé dans la catégorie appropriée sous :

```text
src/features/stats/assets/icons/
```

## Ne pas polluer les prompts

Les prompts individuels ne sont pas des journaux techniques.

Les informations d’avancement de l’addon doivent aller dans :

- `PROJECT_CONTEXT.md`
- `docs/features/STATS_V2_SPEC.md`
- `docs/stats/README.md`

et non dans chaque prompt mono-icône.
