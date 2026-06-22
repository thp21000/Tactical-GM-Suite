# Tactical GM Suite

Suite modulaire pour MJ sur Owlbear Rodeo, centrée sur le suivi tactique en combat et en exploration.

## Modules intégrés actuellement

- Core / Dashboard
- Initiative Tracker
- Distance / Déplacement / Portée
- Stat Tracker

## Modules reportés

- Calendar
- Loot Table

Calendar et Loot Table existent déjà en standalone et seront intégrés plus tard, quand la base de la suite sera stable.

## Installation Owlbear

URL du manifest :

```text
https://thp21000.github.io/Tactical-GM-Suite/manifest.json
```

## Développement local

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Architecture

- `src/core` : constantes globales, registre de modules, stockage commun et intégration Owlbear stable.
- `src/features` : pages et logique propres aux modules fonctionnels.
- `src/shared` : composants, hooks et styles réutilisables.

## État du projet

- Version actuelle : 0.1.0
- Statut : V1 stabilisée / test terrain
