# Instructions pour agents IA

## Règles générales du projet

Tactical GM Suite est une suite modulaire pour MJ sur Owlbear Rodeo.

Respecter l’architecture du projet :

```txt
src/core/
src/features/
src/shared/
```

Ne pas déplacer la logique métier dans `App.tsx`.

Ne pas créer de dossier `utils` fourre-tout.

Ne pas ajouter de nouveau module sans demande explicite.

Ne pas intégrer Calendar ou Loot Table pour l’instant. Ces modules existent déjà en standalone et seront intégrés plus tard, après stabilisation de la suite principale.

## Règles de développement

Avant toute modification importante :

1. Identifier le module concerné.
2. Lire la documentation dédiée si elle existe.
3. Modifier uniquement les fichiers nécessaires.
4. Ne pas casser les modules déjà validés.
5. Lancer les vérifications demandées.

Commandes de vérification habituelles :

```bash
npm run typecheck
npm run build
```

Inclure la sortie réelle de ces commandes dans la réponse finale quand une modification de code est faite.

## Modules actuellement intégrés

Modules actifs :

* Core / Dashboard
* Initiative Tracker
* Distance / Déplacement / Portée
* Stat Tracker

Modules reportés :

* Calendar
* Loot Table

## Stats V2

Avant toute modification liée au module Stats, lire obligatoirement :

```txt
docs/features/STATS_V2_SPEC.md
```

Ce document est la source de vérité fonctionnelle pour Stats V2.

Ne pas improviser une fonctionnalité ou une architecture qui contredit `STATS_V2_SPEC.md`.

## Découpage obligatoire de Stats V2

Respecter le découpage suivant :

```txt
Stats V2.1 — Base des trackers personnalisables
Stats V2.2 — Types de token et presets automatiques
Stats V2.3 — Assignation joueur
Stats V2.4 — Conditions
Stats V2.5 — Affichage sur token
```

Ne pas implémenter plusieurs étapes en une seule fois sans validation explicite.

## Étape Stats actuelle

L’étape actuelle est :

```txt
Stats V2.1 — Base des trackers personnalisables
```

Cette étape doit se limiter à la base des trackers personnalisables.

Elle peut inclure :

* modèle de données des trackers ;
* types visuels de trackers ;
* bibliothèque interne simple d’icônes ;
* ajout, modification, suppression de trackers ;
* affichage en blocs verticaux repliables ;
* valeurs modifiables et non modifiables selon le type ;
* préparation technique pour les presets futurs.

Elle ne doit pas inclure :

* assignation joueur ;
* permissions joueur avancées ;
* conditions complètes ;
* menu clic droit des conditions ;
* affichage direct sur token ;
* placement des trackers autour du token ;
* automatisation complète PF2e ;
* intégration Calendar ;
* intégration Loot Table.

## Rappel sur les trackers Stats

Les trackers ne sont pas tous modifiables rapidement.

Exemples de trackers à valeur non modifiable rapidement :

* CA ;
* Bouclier CA ;
* Bouclier Solidité ;
* niveau ;
* DD ;
* perception passive ;
* valeur calculée.

Ces trackers doivent afficher une valeur, mais ne doivent pas avoir de boutons rapides `+` ou `-`.

Ils doivent être modifiables uniquement via l’édition du tracker.

## Règle de compatibilité interne

Les valeurs suivies par Stats doivent pouvoir être utilisées plus tard par les autres modules de Tactical GM Suite.

Exemples :

* Initiative peut lire les PV ;
* Combat peut appliquer des dégâts ;
* Distance peut lire une vitesse ou une portée ;
* les conditions peuvent influencer l’affichage tactique.

La structure des données doit donc rester claire, stable et exploitable par des services internes.
