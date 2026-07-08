# Task Queue

Cette file sert a guider les prochaines sessions ChatGPT / Codex. Elle ne remplace pas les demandes utilisateur : elle donne seulement un contexte de priorisation.

## Derniere harmonisation documentaire

Statut : termine.

Documents alignes :

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/agent/PROJECT_CONTEXT.md`
- `docs/agent/ROADMAP.md`
- `docs/agent/TASK_QUEUE.md`

Resultat : le README racine, l'architecture et les documents agent indiquent maintenant que la base V1 est stabilisee et que le module Stats a avance jusqu'a `Stats V2.5F — Overlays Owlbear manuels par token`.

## A faire prochainement

### Stabilisation Owlbear

- Tester les overlays Stats manuels dans Owlbear avec plusieurs tokens suivis.
- Verifier le comportement hors scene, hors room ou en mode developpement local.
- Auditer les menus contextuels Owlbear pour confirmer que tous les abonnements sont nettoyes.
- Confirmer que les fallbacks `localStorage` restent coherents avec les metadata Owlbear.

### Stats

- Verifier en test terrain que les metadata Stats evitent bien les doublons d'overlays.
- Documenter les limites restantes avant toute etape de synchronisation plus avancee.
- Preparer Stats V2.5G uniquement si elle est demandee explicitement, probablement autour du positionnement avance des overlays.
- Ajouter des tests legers sur les services Stats purs si une infrastructure de test est introduite.

### Documentation

- Garder `src/features/stats/README.md` comme journal de progression detaille du module Stats.
- Mettre a jour les documents agent apres chaque evolution importante du perimetre projet.
- Verifier periodiquement la coherence entre version package, version manifest Owlbear et statut fonctionnel documente.

### Qualite

- Envisager de remplacer les dependances `latest` par des versions verrouillees si les builds deviennent instables.
- Ajouter des tests ciblant les services de calcul, tri, normalisation et stockage.
- Conserver `npm run typecheck` et `npm run build` comme validations minimales apres modification de code.

## En attente explicite

Ces sujets ne doivent pas etre demarres sans demande claire :

- Integration Calendar.
- Integration Loot Table.
- Synchronisation automatique globale Stats.
- Synchronisation live Stats.
- Suivi automatique des deplacements de tokens.
- Automatisation PF2e complete.
- Refonte de navigation principale.
- Modification du manifest Owlbear.
- Changement de configuration GitHub Pages.
- Modification des scripts npm.

## Template de suivi pour une future tache

```md
## Tache

- Statut : a faire | en cours | termine | bloque
- Module : Core | Initiative | Range | Stats | Shared | Docs
- Objectif :
- Fichiers probables :
- Docs a lire avant modification :
- Verifications attendues :
- Notes / risques :
```
