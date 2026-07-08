# Tactical GM Suite — Architecture

## But du projet

Tactical GM Suite est une extension Owlbear Rodeo modulaire destinee aux MJ. Elle regroupe progressivement des outils tactiques imbriques, sans melanger leurs responsabilites.

## Ordre des blocs de developpement

1. Core / Dashboard
2. Initiative Tracker avance
3. Distance / Deplacement / Portee
4. Stat Tracker graphique avance
5. Integration Calendar
6. Integration Loot Table

Calendar et Loot Table restent reportes tant qu'une demande explicite n'ouvre pas leur integration.

## Separation des dossiers

- `src/core/` contient uniquement la logique commune et stable : constantes, registre des modules, preferences, stockage, wrappers Owlbear et types globaux.
- `src/features/` contient les pages visibles de l'interface, regroupees par fonctionnalite.
- `src/shared/` contient les composants, hooks et styles reutilisables.
- `public/` contient le manifeste Owlbear et les assets publics.
- `docs/` contient la documentation d'architecture, les specs fonctionnelles et le contexte agent.

## Ajouter un nouveau module

1. Declarer son identifiant dans `src/core/constants/ids.ts`.
2. Ajouter sa fiche dans `src/core/modules/moduleRegistry.ts`.
3. Creer un dossier dedie dans `src/features/` uniquement lorsque la fonctionnalite est reellement developpee.
4. Garder les types propres au module dans son dossier de feature, sauf s'ils deviennent globaux.
5. Passer par le registre des modules pour toute donnee affichee dans le Core.
6. Documenter clairement la frontiere du module.

## Regles importantes

- Ne jamais melanger les donnees Calendar, Loot Table, Initiative, Stats et Range dans un meme fichier ou dossier.
- Le Core ne doit contenir que les fondations communes : navigation, parametres locaux, registre, stockage commun, theme et integration Owlbear minimale.
- Les preferences personnelles restent en `localStorage`.
- Les etats actifs partages peuvent utiliser les metadata Owlbear si leur taille reste raisonnable.
- `App.tsx` reste limite au shell, a la navigation et au routage interne simple.
- Ne pas creer de dossier `utils` fourre-tout.

## Bloc 1 — Core / Dashboard

Le Core fournit le shell, la navigation, les preferences locales, le registre de modules, les constantes communes et les wrappers Owlbear de base. Il ne doit pas contenir de logique metier propre a Initiative, Range, Stats, Calendar ou Loot Table.

## Bloc 2 — Initiative Tracker

Le code specifique a l'initiative vit dans `src/features/initiative/` avec ses composants, hooks et services dedies.

Responsabilites actuelles :

- suivi manuel des participants ;
- rounds et tours ;
- etats simples comme actif, vaincu ou cache ;
- import contextuel depuis les items Owlbear ;
- stockage via metadata Owlbear quand la room est prete, avec fallback `localStorage` hors Owlbear.

Le module Initiative ne doit pas integrer de logique Stats, Distance, Calendar ou Loot Table sans demande explicite.

## Bloc 3 — Distance / Deplacement / Portee

Le code specifique aux distances et portees vit dans `src/features/range/`.

Responsabilites actuelles :

- mesure tactique entre items Owlbear ;
- origine et cibles ;
- lecture prudente des items et de la grille Owlbear ;
- presets de portee ;
- preferences locales.

Le module Range ne doit pas automatiser les attaques, les degats, les conditions Stats, Calendar ou Loot Table sans demande explicite.

## Bloc 4 — Stat Tracker

Le code specifique au suivi de statistiques vit dans `src/features/stats/`.

Le module Stats a depasse la V1 initiale et suit maintenant le decoupage Stats V2 documente dans `docs/features/STATS_V2_SPEC.md` et `src/features/stats/README.md`.

Etat actuel observe :

- Stats V2.1 : trackers personnalisables ;
- Stats V2.2 : presets internes et gestion simple par le MJ ;
- Stats V2.3 : assignation joueur, permissions preparees et mode joueur minimal ;
- Stats V2.4 : conditions, durees, sources, notes et effets mecaniques prepares ;
- Stats V2.5A-F : apercu token, payloads dry-run, plan d'overlay, rendu SVG local, adaptateur Owlbear et overlays Owlbear manuels par token.

Limites actuelles importantes :

- pas de synchronisation globale automatique ;
- pas de synchronisation live ;
- pas de suivi automatique des deplacements de tokens ;
- pas d'automatisation PF2e complete ;
- pas d'interaction non demandee avec Initiative ou Range.

## Etat actuel du projet

### Modules integres

- Core / Dashboard : shell, navigation, parametres locaux et registre de modules.
- Initiative Tracker : suivi manuel de participants, rounds, tours et import contextuel Owlbear.
- Distance / Deplacement / Portee : mesures entre items Owlbear, presets de portee et preferences locales.
- Stat Tracker : suivi de tokens, trackers personnalisables, presets, conditions, permissions preparees, apercus token et overlays Owlbear manuels par token.

### Modules reportes

Calendar et Loot Table sont reportes. Ils ne doivent pas etre integres tant que leur chantier n'est pas explicitement demande.

### Regles de stockage

- Les preferences personnelles restent en `localStorage`.
- Les etats actifs partages peuvent utiliser les metadata Owlbear si leur taille reste raisonnable.
- Ne pas stocker d'historique lourd, de logs de degats ou de gros statblocks.
- Toute lecture doit rester robuste si la donnee est absente ou invalide.

### Regles Owlbear

- Les hooks Owlbear doivent no-op hors Owlbear et nettoyer leurs abonnements.
- Les menus contextuels doivent etre crees uniquement quand OBR est pret.
- Les erreurs de scene, grille, bounds ou item sans nom ne doivent pas faire crasher l'application.
- Les actions qui modifient la scene Owlbear doivent rester explicites et limitees au perimetre demande.

### Avant d'ajouter un nouveau module

1. Verifier que `npm run typecheck` et `npm run build` passent.
2. Ajouter les IDs et cles necessaires dans `src/core/constants/ids.ts`.
3. Creer un dossier de feature dedie.
4. Documenter la frontiere du module dans ce fichier.
5. Confirmer que Calendar et Loot Table restent reportes tant que leur integration n'est pas explicitement demandee.

## Historique de release

La version package `0.1.0` correspond a la base V1 stabilisee. Depuis cette base, le module Stats a continue son evolution fonctionnelle jusqu'a Stats V2.5F. Le manifest Owlbear declare actuellement la version `0.2.1`.
