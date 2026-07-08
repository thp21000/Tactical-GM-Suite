# Roadmap

## Vision

Tactical GM Suite doit rester une suite modulaire pour MJ sur Owlbear Rodeo. La priorite est de stabiliser les outils tactiques actifs avant d'ajouter de nouveaux modules.

## Phase actuelle : stabilisation des modules tactiques

Modules concernes :

- Core / Dashboard
- Initiative Tracker
- Distance / Deplacement / Portee
- Stat Tracker

Objectifs :

- conserver une interface simple pour le MJ ;
- fiabiliser les interactions Owlbear ;
- eviter les regressions entre modules ;
- documenter les frontieres fonctionnelles ;
- consolider le retour terrain avant d'ajouter des automatismes.

## Stats V2

Le module Stats suit une roadmap specifique decrite dans `docs/features/STATS_V2_SPEC.md` et `src/features/stats/README.md`.

Etat observe :

- V2.1 : trackers personnalisables.
- V2.2 : presets internes et gestion simple par le MJ.
- V2.3 : assignation joueur, permissions preparees, mode joueur minimal.
- V2.4 : conditions, durees, sources, notes, effets mecaniques prepares.
- V2.5A-F : affichage sur token, rendu SVG local, adaptateur Owlbear et overlays Owlbear manuels par token.

Limites a conserver tant qu'elles ne sont pas explicitement levees :

- pas de synchronisation globale automatique ;
- pas de synchronisation live ;
- pas de suivi automatique des deplacements de token ;
- pas d'automatisation PF2e complete ;
- pas d'interaction non demandee avec Initiative ou Distance.

## Modules futurs

Calendar et Loot Table restent reportes. Ils ne doivent etre integres que lorsqu'une demande explicite ouvre leur chantier.

## Priorites recommandees

1. Tester et stabiliser les overlays Stats manuels avec retours terrain.
2. Auditer les comportements Owlbear hors scene, hors room ou en mode developpement local.
3. Ajouter des tests legers sur les services purs les plus critiques si une infrastructure de test est introduite.
4. Verrouiller les versions de dependances si la stabilite de build devient prioritaire.
5. Preparer les prochaines etapes Stats une par une, sans synchronisation automatique prematuree.

## Hors scope par defaut

- Refonte globale UI.
- Changement de framework.
- Ajout d'un backend.
- Migration massive de stockage.
- Integration Calendar ou Loot Table sans demande explicite.
- Synchronisation automatique globale Stats sans etape dediee.
