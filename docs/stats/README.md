# Stats — Documentation technique et visuelle

Ce dossier regroupe la documentation de design et de production liée au module Stats.

Le cahier des charges fonctionnel principal reste :

```text
docs/features/STATS_V2_SPEC.md
```

Ce fichier sert d’index opérationnel pour l’implémentation visuelle actuelle, les assets et les documents de production.

## 1. État du dossier

Au checkpoint du 2 septembre 2026, `docs/stats/` contient :

```text
docs/stats/
  README.md
  STAT_AUDIO_FEEDBACK_V1.md
  Prompt/
    INDEX_48_PROMPTS_ICONES.md
    INDEX_EXTRA_PROMPTS_ICONES_V2.md
    README_48_PROMPTS_ICONES.md
    README_EXTRA_PROMPTS_ICONES_V2.md
    body/
    arcane/
    resource/
    object/
```

Les anciens documents expérimentaux de design qui ont pu exister dans des états précédents du dépôt ne sont pas présents sur le `main` actuel. Ce README remplace donc les références cassées et décrit le système réellement utilisé.

## 2. Principe visuel fondamental

Le tracker est libre.

Séparer toujours :

```text
sens utilisateur
type visuel
icône
valeur
permissions
visibilité
affichage sur token
```

Une icône ne doit jamais imposer le sens de la donnée.

Exemple valide :

```text
Nom       = Munitions
Type      = Barre
Icône     = body_heart
Current   = 12
Max       = 20
```

Même si ce choix semble atypique, l’addon doit l’accepter.

## 3. Style supprimé

L’ancien concept de `skinId` a été retiré de l’interface.

Le type existe encore uniquement pour compatibilité des anciennes sauvegardes.

Le rendu actuel est déterminé par :

- le renderer du type visuel ;
- l’icône choisie ;
- la couleur d’accent déclarée de cette icône ;
- le thème Owlbear.

## 4. Bibliothèque d’icônes

Assets runtime :

```text
src/features/stats/assets/icons/
  Corps & Protection/
  Arcane & Combat/
  Ressources & Richesses/
  Objets & Marques/
```

Chargement :

```ts
import.meta.glob("../assets/icons/**/*.png", {
  eager: true,
  import: "default",
})
```

Les catégories ne portent aucune sémantique de règles ; elles servent uniquement au classement.

## 5. Bibliothèque documentée

Deux jeux de prompts sont conservés.

### Base V1

`Prompt/INDEX_48_PROMPTS_ICONES.md`

- 48 icônes ;
- 12 par catégorie ;
- bibliothèque de départ.

### Ajouts V2

`Prompt/INDEX_EXTRA_PROMPTS_ICONES_V2.md`

- 15 icônes supplémentaires ;
- descriptions autonomes ;
- sujets issus des besoins apparus pendant le développement.

Total documenté :

```text
48 + 15 = 63 identifiants
```

Le registre TypeScript connaît actuellement ces identifiants et leurs labels/couleurs d’accent. Seuls les PNG réellement présents dans les dossiers d’assets sont chargés dans l’UI.

## 6. Pourquoi les prompts individuels ne sont pas modifiés par les mises à jour projet

Les fichiers :

```text
Prompt/body/*.md
Prompt/arcane/*.md
Prompt/resource/*.md
Prompt/object/*.md
```

sont des **payloads de génération mono-icône**, pas des documents de suivi du projet.

Ils doivent rester autonomes et ne contenir que les instructions utiles à la génération.

Ajouter un journal de version, une note de contexte projet ou une longue section technique dans chacun risquerait de dégrader la génération d’image.

Lors d’un checkpoint documentaire :

- auditer les index ;
- mettre à jour les README du pack ;
- ne toucher aux prompts individuels que si la direction artistique ou la description de l’icône doit réellement changer.

## 7. Direction artistique des icônes

Direction validée :

- fantasy RPG ;
- originale ;
- stylisée ;
- légèrement semi-réaliste ;
- silhouette simple ;
- détails modérés ;
- contour sombre propre ;
- volume doux ;
- lumière haut-gauche ;
- couleurs riches sans néon ;
- fond réellement transparent ;
- aucune interface/barre intégrée à l’image ;
- pas de texte/logo/watermark ;
- lisible autour de 24–32 px.

L’asset source reste une icône couleur unique. Désaturation, remplissage, sélection et autres états sont produits par l’addon.

## 8. Couleurs d’accent

`services/statTrackerIcons.ts` contient `ICON_ACCENTS`.

Règle :

> ne pas analyser automatiquement la couleur dominante du PNG.

Une couleur contrôlée est déclarée pour chaque asset connu afin d’obtenir un rendu cohérent dans les barres.

Fallback : accent de catégorie.

## 9. Renderer `bar`

Nom UI : **Barre à valeur max**.

Structure :

```text
Nom                         ...
[icône] [==== remplissage ====    ] max X
                    current
```

Caractéristiques :

- icône à gauche ;
- couleur basée sur l’accent de l’icône ;
- gradient sombre → lumineux ;
- jusqu’à 56 spécifications de bulles pseudo-aléatoires stables par tracker ;
- nombre de bulles visibles proportionnel au remplissage ;
- bord partiel organique ;
- désaturation progressive de l’icône vers 0 ;
- valeur centrale éditable ;
- drag horizontal ;
- valeur bornée 0..max.

Calcul inline :

```text
12
+3
-2
*2
x2
×2
/2
÷2
```

## 10. Renderer `counter`

Nom UI : **Indicateur modifiable**.

Structure :

```text
Nom                         ...
[-5] [-1] [ ORBE 48 px / valeur ] [+1] [+5]
```

Règles :

- pas de min ;
- pas de max ;
- négatif accepté ;
- pas de drag ;
- valeur éditable/calcul inline ;
- fond du champ central transparent pour préserver l’icône.

## 11. Renderer `readonly`

Nom UI : **Indicateur fixe**.

Le nom technique est historique.

Structure :

```text
Nom      ...
[ ORBE 48 px / valeur ]
```

Pas de rail, pas de boutons.

La valeur reste éditable/calculable directement.

Jusqu’à trois trackers `readonly` peuvent partager une ligne selon la largeur disponible.

## 12. Renderer `toggle`

Structure :

```text
Nom      ...
[ ORBE 48 px / icône ]
```

- actif : couleur ;
- inactif : désaturé ;
- clic pour basculer ;
- aucun chiffre.

Jusqu’à trois par ligne.

## 13. Renderer `icon`

Le type technique `icon` correspond maintenant à l’**indicateur à icônes cumulatives**.

Configuration :

```text
current = unités actives
max     = nombre d’unités affichées
```

Contraintes actuelles :

```text
1 <= max <= 6
```

Règles de clic :

```text
inactive index N -> active 1..N
active index N   -> désactive N..fin
```

Il n’utilise pas de barre ni de drag.

## 14. Header et administration

Dans l’interface principale, les renderers modernes utilisent :

- nom centré en haut ;
- `…` en haut à droite.

Le menu `…` contient les actions d’administration nécessaires :

- Afficher/Masquer sur le token ;
- Modifier ;
- Supprimer.

Les sous-menus rapides Owlbear masquent volontairement ce `…`.

## 15. Sous-menu rapide Stats

Le Context Menu Stats réutilise les mêmes cartes/renderers mais dans un contexte CSS plus étroit.

Layout :

- `bar`, `counter`, `icon` : pleine largeur ;
- `readonly`, `toggle` : grille jusqu’à trois colonnes.

But :

> changer une valeur en quelques secondes sans ouvrir la fiche du token.

Il ne doit pas devenir une seconde interface d’administration.

## 16. Thème Owlbear

Les interfaces Stats utilisent la couche globale OBR :

```text
src/shared/styles/obrIntegratedUi.css
```

Les sous-menus récupèrent le thème OBR et appliquent les variables Tactical GM Suite correspondantes.

La valeur Overlay Effect doit être respectée pour garder un aspect cohérent avec les autres extensions Owlbear.

## 17. Scrollbars

Les scrollbars doivent utiliser le style partagé et rester discrètes.

Dans les embeds contextuels, une scrollbar locale très fine est autorisée si la largeur Owlbear l’exige.

## 18. Accessibilité

- ne pas rendre une information compréhensible uniquement grâce à la couleur ;
- garder une valeur textuelle pour les trackers numériques ;
- préserver le focus clavier ;
- `bar` supporte clavier et pointer ;
- respecter `prefers-reduced-motion` ;
- l’audio futur ne doit jamais être le seul feedback.

## 19. Audio

Voir :

```text
STAT_AUDIO_FEEDBACK_V1.md
```

État courant :

- direction audio définie ;
- convention 1 son signature par icône ;
- aucun service runtime audio identifié dans le code au checkpoint ;
- donc fonctionnalité **prévue**, pas encore implémentée.

## 20. Documents prompts

Utilisation recommandée :

```text
1 fichier .md mono-icône
1 nouveau chat idéalement
"Suis ce prompt et seulement lui."
1 image finale
```

Cette méthode a été retenue parce que les générations en lot ont produit des planches ou plusieurs variantes du même sujet.

## 21. Références

- `docs/features/STATS_V2_SPEC.md`
- `src/features/stats/README.md`
- `src/features/stats/services/statTrackerIcons.ts`
- `src/features/stats/components/StatTrackerCard.tsx`
- `src/features/stats/statMaxValueBar.css`
- `src/features/stats/statMaxValueBarLiquid.css`
- `src/features/stats/statCounterBar.css`
- `src/features/stats/statFixedOrb.css`
- `src/features/stats/statIconUnits.css`
- `src/features/stats/context/statTrackerContextMenu.css`
