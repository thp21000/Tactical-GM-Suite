# Stats — Documentation technique et visuelle

> Mise à jour : **4 septembre 2026**.

Ce dossier regroupe la documentation de design et de production liée au module Stats et au sous-système Conditions.

Le cahier des charges fonctionnel principal reste :

```text
docs/features/STATS_V2_SPEC.md
```

## 1. État du dossier

Documents principaux :

```text
docs/stats/
  README.md
  CONDITIONS_MASTER_CATALOG_V1.md
  CONDITIONS_RUNTIME_SYNC.md
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

`CONDITIONS_MASTER_CATALOG_V1.md` décrit les 46 entrées canoniques et leurs variantes de règles D&D 5e / PF2e.

`CONDITIONS_RUNTIME_SYNC.md` décrit l’état réellement implémenté du runtime Conditions : cache, overlays, géométrie, resize et séparation avec Stats.

## 2. Principe visuel fondamental des trackers

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

Le type existe encore uniquement pour compatibilité de lecture interne.

Le rendu actuel est déterminé par :

- le renderer du type visuel ;
- l’icône choisie ;
- la couleur d’accent déclarée de cette icône ;
- le thème Owlbear.

## 4. Bibliothèque d’icônes Trackers

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

## 5. Bibliothèque documentée Trackers

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

## 6. Direction artistique des icônes Trackers

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

## 7. Couleurs d’accent

`services/statTrackerIcons.ts` contient les accents déclarés.

Règle : ne pas analyser automatiquement la couleur dominante du PNG.

Une couleur contrôlée est déclarée pour obtenir un rendu cohérent dans les barres.

## 8. Renderer `bar`

Nom UI : **Barre à valeur max**.

Caractéristiques :

- icône à gauche ;
- couleur basée sur l’accent de l’icône ;
- gradient sombre → lumineux ;
- bulles pseudo-aléatoires stables ;
- densité proportionnelle au remplissage ;
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

## 9. Renderer `counter`

Nom UI : **Indicateur modifiable**.

- pastille centrale 48 px ;
- `-5`, `-1`, `+1`, `+5` ;
- pas de min/max ;
- négatif accepté ;
- pas de drag ;
- valeur éditable/calcul inline.

## 10. Renderer `readonly`

Nom UI : **Indicateur fixe**.

Le nom technique est historique.

- pastille 48 px ;
- aucun rail ;
- aucun bouton ;
- valeur toujours éditable/calculable ;
- jusqu’à trois par ligne selon la largeur disponible.

## 11. Renderer `toggle`

- pastille 48 px ;
- aucun chiffre ;
- actif : couleur ;
- inactif : désaturé ;
- clic pour basculer ;
- jusqu’à trois par ligne.

## 12. Renderer `icon`

Le type technique `icon` correspond à l’indicateur à icônes cumulatives.

```text
current = unités actives
max     = nombre d’unités affichées
1 <= max <= 6
```

Règles :

```text
inactive index N -> active 1..N
active index N   -> désactive N..fin
```

## 13. Administration et menu rapide

Dans l’interface principale MJ, le menu `…` contient :

- Afficher/Masquer sur le token ;
- Modifier ;
- Supprimer.

Le Context Menu Stats est volontairement une interface de changement rapide et masque ces actions.

Layout :

- `bar`, `counter`, `icon` : pleine largeur ;
- `readonly`, `toggle` : jusqu’à trois colonnes.

## 14. Conditions — catalogue canonique

Assets :

```text
src/features/stats/assets/condition/Icon/
```

Catalogue runtime :

```text
src/features/stats/services/statConditionCatalog.ts
```

Contenu :

```text
DND5E   -> 15
PF2E    -> 42
GENERIC -> 0 actuellement
```

Le runtime fonctionne uniquement avec les IDs canoniques. L’ancien catalogue historique et ses aliases ont été supprimés.

## 15. Conditions — liste et interaction

Le flux principal reste :

```text
clic droit token
→ Conditions
→ recherche / liste
→ activation, désactivation ou édition
```

La liste :

- est triée alphabétiquement selon le libellé de la langue active ;
- indique les conditions actives ;
- autorise plusieurs conditions actives simultanément ;
- ne désactive jamais automatiquement les autres conditions lors d’un ajout ;
- permet d’éditer une condition active sans modifier les autres.

Au hover, la carte d’information s’ancre à la ligne survolée et affiche :

- Description ;
- Résumé règles correspondant au système sélectionné.

## 16. Conditions — affichage sur token

Les conditions utilisent des médaillons PNG autour du token.

État actuel :

```text
BASE_BADGE_SCALE = 0.2574
MAX_BADGES_PER_RING = 12
FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22
RING_CENTER_X_OFFSET_RATIO = -0.03
RING_CENTER_Y_OFFSET_RATIO = -0.025
```

La taille réelle suit proportionnellement la taille du token :

```text
badgeScale = BASE_BADGE_SCALE × (tokenDiameter / sceneDpi)
```

Le rayon et l’espacement de la couronne utilisent la même échelle dynamique.

Le niveau/valeur d’une condition n’est plus imprimé sur le token. Il reste consultable et modifiable dans le menu Conditions.

Voir `CONDITIONS_RUNTIME_SYNC.md` pour le détail.

## 17. Séparation Stats / Conditions

Principe non négociable :

```text
Stats      -> token.trackers   -> overlay Stats
Conditions -> token.conditions -> badges Conditions
```

Les deux systèmes :

- possèdent des services de sync distincts ;
- possèdent des métadonnées Owlbear distinctes ;
- ne doivent pas se réveiller mutuellement.

Une modification Conditions ne doit donc jamais faire réapparaître l’overlay Stats.

## 18. Préchargement des PNG

Le background lance le préchargement dès que Owlbear est prêt.

Ordre :

1. assets Conditions ;
2. assets Trackers.

La concurrence est limitée à 4 chargements pour éviter de bloquer le démarrage de la room.

Le but est de chauffer le cache navigateur avant le premier menu/overlay.

## 19. Thème Owlbear

Les interfaces Stats utilisent la couche globale OBR :

```text
src/shared/styles/obrIntegratedUi.css
```

Les sous-menus récupèrent le thème OBR et appliquent les variables Tactical GM Suite correspondantes.

## 20. Accessibilité

- ne pas rendre une information compréhensible uniquement grâce à la couleur ;
- garder une valeur textuelle pour les trackers numériques ;
- préserver le focus clavier ;
- respecter `prefers-reduced-motion` ;
- le niveau des Conditions reste accessible dans le menu même s’il n’est plus dessiné sur le token ;
- l’audio futur ne doit jamais être le seul feedback.

## 21. Audio

Voir :

```text
STAT_AUDIO_FEEDBACK_V1.md
```

État courant : direction audio définie, mais aucun service runtime audio n’est considéré comme implémenté.

## 22. Documents prompts

Les fichiers mono-icône dans `Prompt/` sont des payloads de génération et ne doivent pas être pollués par le journal du projet.

Méthode recommandée :

```text
1 fichier .md mono-icône
1 sujet
1 génération
```

## 23. Références

- `docs/features/STATS_V2_SPEC.md`
- `docs/stats/CONDITIONS_MASTER_CATALOG_V1.md`
- `docs/stats/CONDITIONS_RUNTIME_SYNC.md`
- `src/features/stats/README.md`
- `src/features/stats/services/statTrackerIcons.ts`
- `src/features/stats/services/statConditionCatalog.ts`
- `src/features/stats/services/statConditionOverlayObrSync.ts`
- `src/features/stats/services/statConditionOverlayAutoSync.ts`
- `src/features/stats/services/statAssetPreload.ts`
