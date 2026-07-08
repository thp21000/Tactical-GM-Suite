# Codex Workflow

## Objectif

Ce workflow aide Codex et ChatGPT a travailler sur Tactical GM Suite sans perdre le contexte projet ni casser les modules deja valides.

## 1. Cadrer la demande

Avant d'agir, identifier :

- le module concerne ;
- le type de travail : analyse, correction, nouvelle etape, documentation, verification ;
- les fichiers interdits ou sensibles mentionnes par l'utilisateur ;
- les validations attendues.

Si la demande est limitee a une analyse, ne modifier aucun fichier.

## 2. Lire le contexte minimal

Toujours commencer par les documents et fichiers proches du sujet.

Pour une demande generale :

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `README.md`

Pour Stats :

- `docs/features/STATS_V2_SPEC.md`
- `src/features/stats/README.md`
- les types, hooks, services et composants Stats touches par la demande

Pour Owlbear :

- `src/core/obr/`
- les hooks du module concerne
- les imports existants de `@owlbear-rodeo/sdk`

## 3. Inspecter avant de coder

Avant toute modification :

- reperer les patterns existants ;
- verifier le stockage utilise ;
- verifier les types disponibles ;
- verifier les composants ou services similaires ;
- eviter les abstractions nouvelles si les patterns locaux suffisent.

## 4. Modifier petit et local

Les changements doivent etre :

- centres sur le module demande ;
- compatibles avec les types existants ;
- robustes hors Owlbear si Owlbear est implique ;
- documentes seulement quand cela aide vraiment.

Ne pas faire de refactor opportuniste dans des zones non demandees.

## 5. Verifier

Pour du code TypeScript / React :

```bash
npm run typecheck
npm run build
```

Si la demande est uniquement documentaire, les validations de build ne sont pas obligatoires sauf demande explicite.

## 6. Rendre compte

La reponse finale doit etre courte et utile :

- fichiers crees ou modifies ;
- resume du changement ;
- validations effectuees ;
- limites restantes ;
- prochaines etapes recommandees si pertinent.

## 7. Gestion des risques

En cas de doute sur une API Owlbear ou une structure interne :

- ne pas forcer ;
- retourner un diagnostic clair ;
- conserver un fallback sur ;
- demander confirmation si le choix peut impacter plusieurs modules.
