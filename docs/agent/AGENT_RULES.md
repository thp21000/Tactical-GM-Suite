# Agent Rules

## Regle principale

Un agent doit modifier uniquement ce qui est necessaire pour la demande en cours. Le projet est modulaire : chaque changement doit respecter les frontieres entre `core`, `features` et `shared`.

## Avant toute modification

1. Identifier le module concerne.
2. Lire la documentation projet pertinente.
3. Lire les fichiers existants avant de proposer une structure nouvelle.
4. Verifier les conventions locales de nommage, stockage, hooks et composants.
5. Limiter le changement au perimetre demande.

## Documentation obligatoire selon le sujet

- Toute modification globale : lire `AGENTS.md` et `docs/ARCHITECTURE.md`.
- Toute modification Stats : lire `docs/features/STATS_V2_SPEC.md` et `src/features/stats/README.md`.
- Toute modification Owlbear : inspecter les wrappers et hooks existants avant d'utiliser le SDK.

## Interdictions par defaut

- Ne pas integrer Calendar ou Loot Table sans demande explicite.
- Ne pas ajouter un nouveau module sans demande explicite.
- Ne pas deplacer la logique metier dans `App.tsx`.
- Ne pas creer de dossier `utils` generique.
- Ne pas modifier `package.json`, `package-lock.json`, `public/manifest.json`, la configuration de build ou GitHub Pages sauf si la demande le precise.
- Ne pas melanger Initiative, Range et Stats dans un meme service.

## Regles Owlbear

- Toujours verifier que Owlbear est disponible et pret avant d'appeler les API de scene ou de room.
- Prevoir un comportement hors Owlbear, generalement via fallback local ou no-op.
- Nettoyer les abonnements et menus contextuels.
- Ne pas inventer d'API SDK : inspecter les imports et usages existants.
- Les actions qui modifient la scene doivent rester explicites, limitees et documentees.

## Regles Stats

- Respecter le decoupage Stats V2 documente.
- Ne pas implementer plusieurs etapes fonctionnelles en une seule fois sans validation.
- Les trackers doivent rester exploitables par d'autres modules plus tard.
- Les permissions joueur et la visibilite doivent rester prudentes.
- Les overlays Owlbear ne doivent pas introduire de synchronisation automatique si la demande parle d'action manuelle.

## Validation attendue apres modification de code

Sauf demande contraire, lancer :

```bash
npm run typecheck
npm run build
```

Inclure la sortie reelle dans le compte rendu final quand du code a ete modifie.

## Reponse finale attendue

Pour une modification, resumer :

- les fichiers modifies ou crees ;
- le comportement ajoute ou change ;
- les limites conservees ;
- les validations lancees ou non lancees.
