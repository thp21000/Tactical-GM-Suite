# Tactical GM Suite

Suite modulaire pour MJ sur Owlbear Rodeo, centree sur le suivi tactique en combat et en exploration.

## Modules integres actuellement

- Core / Dashboard
- Initiative Tracker
- Distance / Deplacement / Portee
- Stat Tracker

## Etat fonctionnel actuel

La base V1 de la suite est stabilisee pour les modules tactiques principaux. Le module Stats a continue son evolution en Stats V2 et inclut actuellement les etapes jusqu'a :

```txt
Stats V2.5F — Overlays Owlbear manuels par token
```

En pratique, Stats permet deja le suivi de tokens avec trackers personnalisables, presets, assignation joueur preparee, permissions joueur preparees, conditions, apercus d'affichage token, rendu SVG local et creation / mise a jour / suppression manuelle d'overlays Owlbear par token.

Les overlays Stats restent volontairement limites : action manuelle, token par token, sans synchronisation globale, sans synchronisation live et sans suivi automatique des deplacements.

## Modules reportes

- Calendar
- Loot Table

Calendar et Loot Table existent ou sont prevus hors du coeur actuel. Ils seront integres plus tard uniquement quand leur chantier sera explicitement ouvert.

## Installation Owlbear

URL du manifest :

```text
https://thp21000.github.io/Tactical-GM-Suite/manifest.json
```

## Developpement local

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Architecture

- `src/core` : constantes globales, registre de modules, stockage commun et integration Owlbear stable.
- `src/features` : pages et logique propres aux modules fonctionnels.
- `src/shared` : composants, hooks et styles reutilisables.
- `docs` : documentation projet, specifications fonctionnelles et contexte agent.
- `public` : manifest Owlbear et assets publics.

## Documentation utile

- `docs/ARCHITECTURE.md` : architecture globale et frontieres entre modules.
- `docs/features/STATS_V2_SPEC.md` : source de verite fonctionnelle pour Stats V2.
- `src/features/stats/README.md` : journal d'etat detaille du module Stats.
- `docs/agent/` : contexte et workflow pour ChatGPT / Codex.

## Etat du projet

- Version package npm : `0.1.0`.
- Version manifest Owlbear : `0.2.1`.
- Statut : base V1 stabilisee, Stats avance jusqu'a V2.5F, test terrain et stabilisation continue.
