# Task Queue

Cette file sert a guider les prochaines sessions ChatGPT / Codex. Elle ne remplace pas les demandes utilisateur : elle donne seulement un contexte de priorisation.

## A faire prochainement

### Documentation

- Harmoniser le README racine avec l'etat reel des modules actifs.
- Verifier que `docs/ARCHITECTURE.md` reflete les etapes Stats V2 deja implementees.
- Garder `src/features/stats/README.md` comme journal de progression detaille du module Stats.

### Stabilisation

- Verifier les flux Owlbear hors scene, hors room ou en mode developpement local.
- Auditer les menus contextuels Owlbear pour confirmer que tous les abonnements sont nettoyes.
- Confirmer que les fallbacks `localStorage` restent coherents avec les metadata Owlbear.

### Stats

- Tester manuellement les overlays Owlbear token par token.
- Verifier que les metadata Stats evitent bien les doublons.
- Documenter les limites restantes avant toute etape de synchronisation plus avancee.
- Ajouter des tests legers sur les services Stats purs si une infrastructure de test est introduite.

### Qualite

- Envisager de remplacer les dependances `latest` par des versions verrouillees si les builds deviennent instables.
- Ajouter des tests ciblant les services de calcul, tri et normalisation.
- Conserver `npm run typecheck` et `npm run build` comme validations minimales apres modification de code.

## En attente explicite

Ces sujets ne doivent pas etre demarres sans demande claire :

- Integration Calendar.
- Integration Loot Table.
- Synchronisation automatique globale Stats.
- Automatisation PF2e complete.
- Refonte de navigation principale.
- Modification du manifest Owlbear.
- Changement de configuration GitHub Pages.

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
