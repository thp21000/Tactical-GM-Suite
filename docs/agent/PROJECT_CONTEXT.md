# Project Context

## Projet

Tactical GM Suite est une suite modulaire pour MJ sur Owlbear Rodeo. Elle regroupe progressivement des outils tactiques pour faciliter la gestion de combat, de distance, de suivi de tokens et, plus tard, d'autres aides de table.

## Objectif produit

Le projet vise une extension Owlbear Rodeo simple a utiliser en partie, avec des modules separes et stables. Chaque module doit rester focalise sur son domaine, sans transformer l'application en fiche de personnage complete ni en automatisation totale de systeme de jeu.

## Modules actifs

- Core / Dashboard : shell, navigation, preferences locales et registre des modules.
- Initiative Tracker : suivi manuel des participants, rounds, tours et import depuis le contexte Owlbear.
- Distance / Deplacement / Portee : mesure tactique entre tokens/items Owlbear, presets et preferences locales.
- Stat Tracker : suivi de tokens, trackers personnalisables, presets, conditions, permissions preparees, apercus token et overlays Owlbear manuels par token.

## Modules reportes

- Calendar.
- Loot Table.

Ces modules existent ou sont prevus hors du coeur actuel. Ils ne doivent pas etre integres sans demande explicite.

## Architecture generale

Le projet suit une separation stricte :

- `src/core/` pour les fondations communes : constantes, registre, stockage, theme et wrappers Owlbear.
- `src/features/` pour les modules fonctionnels.
- `src/shared/` pour les composants, hooks et styles reutilisables.
- `docs/` pour la documentation projet, les specs fonctionnelles et le contexte agent.
- `public/` pour le manifest Owlbear et les assets publics.

## Contraintes importantes

- Ne pas deplacer de logique metier dans `App.tsx`.
- Ne pas creer de dossier `utils` fourre-tout.
- Ne pas melanger les responsabilites entre Initiative, Range, Stats, Calendar et Loot Table.
- Toute evolution Stats importante doit respecter `docs/features/STATS_V2_SPEC.md`.
- Les hooks Owlbear doivent rester robustes hors Owlbear et nettoyer leurs abonnements.
- Les actions qui modifient la scene Owlbear doivent rester manuelles, explicites et limitees au perimetre demande.

## Etat fonctionnel observe

Le projet est une application React / TypeScript / Vite publiee sur GitHub Pages et exposee a Owlbear via `public/manifest.json`.

La base V1 est stabilisee pour les modules tactiques principaux. Le module Stats est le plus avance fonctionnellement et suit maintenant Stats V2 jusqu'a `Stats V2.5F — Overlays Owlbear manuels par token`.

Stats contient deja les trackers personnalisables, presets, permissions joueur preparees, conditions, rendu SVG local, adaptateur Owlbear et creation / mise a jour / suppression manuelle d'overlays Owlbear token par token.

Les limites actuelles restent importantes : pas de synchronisation globale, pas de synchronisation live, pas de suivi automatique des deplacements de tokens et pas d'automatisation PF2e complete.

## Versions documentees

- Version package npm : `0.1.0`.
- Version manifest Owlbear : `0.2.1`.
