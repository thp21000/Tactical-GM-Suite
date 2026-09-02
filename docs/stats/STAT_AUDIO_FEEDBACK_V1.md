# STAT_AUDIO_FEEDBACK_V1

## Statut

**Spécification validée, implémentation runtime non encore identifiée dans le code au checkpoint du 2 septembre 2026.**

La bibliothèque visuelle documentée comporte désormais :

- 48 icônes de base ;
- 15 icônes additionnelles ;
- soit 63 identifiants connus par le registre visuel.

Ce document décrit la direction audio à suivre lorsque le chantier audio sera ouvert. Il ne faut pas présenter les sons Stats comme une fonctionnalité actuellement livrée.

## 1. Objectif

Chaque icône Stats peut posséder un son signature court.

Le son suit **l’icône choisie**, jamais la signification supposée de la stat.

Exemples :

- `body_heart` → battement doux ;
- `body_shield` → impact métallique mat ;
- `arcane_rune` → chime magique cristallin ;
- `arcane_sword` → résonance courte de lame ;
- `resource_vial` → verre + liquide discret ;
- `resource_coin` → tintement de pièce ;
- `object_gear` → clic mécanique ;
- `object_hourglass` → verre/sable discret.

Si le cœur représente des munitions, il conserve tout de même son son de cœur.

## 2. Décision de production

Règle :

> **1 son signature par icône.**

Ne pas créer un fichier différent pour chaque interaction.

Le même asset peut être utilisé pour :

- clic ;
- augmentation ;
- diminution ;
- toggle ON ;
- toggle OFF.

Une légère variation runtime peut différencier les interactions.

Avec la bibliothèque actuelle, le plafond documentaire devient potentiellement :

```text
63 icônes connues
63 sons signature maximum
```

Seuls les sons réellement produits/intégrés doivent être chargés.

## 3. Variations runtime

### Click

- son original ;
- pitch neutre ;
- volume bas.

### Increase

- même son ;
- pitch très légèrement positif si possible.

### Decrease

- même son ;
- pitch très légèrement négatif.

### Toggle ON/OFF

- même identité sonore ;
- petite variation positive/négative possible.

Les variations doivent rester subtiles.

## 4. Brief sonore

Chaque son doit être :

- original ;
- court ;
- propre ;
- fantasy/tactique ;
- évocateur de l’objet visuel ;
- adapté aux répétitions ;
- sans voix ;
- sans musique ;
- sans ambiance longue ;
- sans sample protégé ;
- non agressif.

Durée cible :

```text
80 à 450 ms
```

Exception acceptable : jusqu’à environ 600 ms pour un matériau qui en a besoin.

## 5. Direction générale

Ambiance :

- interface RPG fantasy ;
- tactile ;
- premium mais sobre ;
- non cartoon ;
- non arcade ;
- non « reward spam » mobile.

Le son accompagne l’action sans dominer la table.

## 6. Registry futur

Architecture recommandée :

```text
tracker.iconId
  -> icon definition / soundId
  -> audio registry
  -> asset
  -> variation d'interaction
```

Convention privilégiée :

```text
iconId == soundId
```

Exemple :

```text
body_heart.png
body_heart.ogg
```

Le format final doit être choisi au moment de l’implémentation selon la compatibilité navigateur et la taille.

## 7. Arborescence proposée

```text
src/features/stats/assets/
  icons/
    Corps & Protection/
    Arcane & Combat/
    Ressources & Richesses/
    Objets & Marques/

  sounds/
    body/
    arcane/
    resource/
    object/
```

La structure sonore peut utiliser les IDs techniques même si les dossiers d’icônes utilisent actuellement des libellés français.

## 8. Service runtime attendu

Ne pas hardcoder le son dans chaque renderer.

Créer un service conceptuel :

```ts
playStatIconSound(iconId, interactionType)
```

Responsabilités :

1. résoudre l’icône ;
2. résoudre le son ;
3. appliquer volume/pitch ;
4. gérer cooldown/overlap ;
5. jouer ;
6. échouer silencieusement si l’asset manque.

## 9. Événements logiques

```text
iconClick
valueIncrease
valueDecrease
toggleOn
toggleOff
```

Le drag d’une barre ne doit pas déclencher des dizaines de sons par seconde. Prévoir un seuil, un cooldown ou jouer uniquement à la fin du geste.

## 10. Réglages utilisateur futurs

À prévoir :

```text
Stats UI Sounds: On / Off
Stats UI Sound Volume: 0–100 %
```

Le défaut doit rester discret.

Respecter les restrictions autoplay : aucun son avant une vraie interaction utilisateur.

## 11. Fallback

Si le son manque :

```text
silence
```

Pas de son générique sans rapport.

L’interaction visuelle continue de fonctionner.

## 12. Accessibilité

L’audio n’est jamais la seule confirmation.

Interdits :

- boucle ;
- battement permanent ;
- hum magique permanent ;
- ambiance continue ;
- gros impact ;
- aigu agressif ;
- volume surprenant.

## 13. Performance

Éviter :

- précharger 63 WAV lourds ;
- instancier un nouvel objet audio non borné à chaque clic ;
- faire se superposer des dizaines d’instances.

Préférer :

- format compressé adapté au navigateur ;
- lazy-load ;
- cache après premier usage ;
- petit pool ou voice limiting.

## 14. Directions des huit références initiales

| Icône | ID | Direction |
|---|---|---|
| Cœur | `body_heart` | battement court, doux, grave |
| Bouclier | `body_shield` | tap métallique mat |
| Rune | `arcane_rune` | chime magique cristallin |
| Épée | `arcane_sword` | résonance de lame courte |
| Fiole | `resource_vial` | verre + léger liquide |
| Pièce | `resource_coin` | tintement bref |
| Engrenage | `object_gear` | clic mécanique compact |
| Sablier | `object_hourglass` | petit tick + sable très court |

## 15. Template de brief

```text
Créer un son UI original, court, fantasy RPG, pour l’icône Tactical GM Suite Stats : [NOM].

Le son doit évoquer : [CONCEPT].

Style :
feedback d’interface fantasy discret, tactile, propre, sobre et adapté à des utilisations répétées.

Durée :
environ [DURÉE].

Caractère :
[MATIÈRE / SENSATION].

À éviter :
voix, musique, ambiance, impact cinématographique, basses excessives, transitoire agressive, son arcade, son cartoon, longue réverbération, sample protégé.
```

## 16. Non-objectifs

Ne pas créer :

- plusieurs sons obligatoires par icône ;
- musique ;
- soundscape ;
- son basé sur le nom du tracker ;
- son basé sur le preset ;
- son persistant.

## 17. Documents liés

Documentation courante :

- `docs/stats/README.md`
- `docs/features/STATS_V2_SPEC.md`
- `docs/stats/Prompt/INDEX_48_PROMPTS_ICONES.md`
- `docs/stats/Prompt/INDEX_EXTRA_PROMPTS_ICONES_V2.md`

Les anciennes références à `ICON_MASTER_PROMPT_V2.md` ou `ICON_RENDERING_IMPLEMENTATION_V1.md` ne correspondent plus à des fichiers présents dans le `main` courant ; ne pas les utiliser comme dépendances documentaires tant qu’ils ne sont pas recréés explicitement.
