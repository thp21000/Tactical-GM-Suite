# README — 48 prompts d’icônes de base

Ce pack contient les **48 prompts mono-icône de base** de Tactical GM Suite Stats.

## Pourquoi du mono-icône

Les essais de génération par lot ont montré des échecs récurrents :

- planche regroupant plusieurs sujets ;
- plusieurs variantes de la même icône ;
- contamination par le sujet précédent ;
- recours à des rendus de secours de moindre qualité.

La méthode retenue est donc volontairement stricte :

```text
1 fichier = 1 sujet = 1 génération = 1 image finale
```

## Utilisation

Pour chaque icône :

1. ouvrir idéalement un nouveau chat ;
2. joindre **un seul** fichier prompt ;
3. écrire `Suis ce prompt et seulement lui.` ;
4. générer une seule image ;
5. vérifier le vrai fond transparent ;
6. enregistrer le PNG sous l’ID technique ;
7. passer au fichier suivant.

## Structure

```text
body/      Corps & Protection
arcane/    Arcane & Combat
resource/  Ressources & Richesses
object/    Objets & Marques
```

L’index complet est :

```text
INDEX_48_PROMPTS_ICONES.md
```

Les ajouts ultérieurs sont :

```text
INDEX_EXTRA_PROMPTS_ICONES_V2.md
```

## Intégration runtime

Placer l’asset final dans la catégorie correspondante de :

```text
src/features/stats/assets/icons/
```

Le nom du fichier doit être l’ID :

```text
body_heart.png
arcane_rune.png
resource_coin.png
object_gear.png
```

Le registre Runtime charge les PNG par `import.meta.glob`.

## Important

Les fichiers individuels de ce pack sont des **prompts d’exécution**. Ils ne doivent pas recevoir de journal de projet ou de notes de version générales.

Pour le contexte technique du système d’icônes, lire :

```text
docs/stats/README.md
```
