# Tactical GM Suite — Architecture

## But du projet

Tactical GM Suite est une extension Owlbear Rodeo modulaire destinée aux MJ. Elle doit regrouper progressivement des outils tactiques imbriqués, sans mélanger leurs responsabilités.

## Ordre des blocs de développement

1. Core / Dashboard
2. Initiative Tracker avancé
3. Distance / Déplacement / Portée
4. Stat Tracker graphique avancé
5. Intégration Calendar
6. Intégration Loot Table

## Séparation des dossiers

- `src/core/` contient uniquement la logique commune et stable : constantes, registre des modules, préférences, stockage, wrappers Owlbear et types globaux.
- `src/features/` contient les pages visibles de l'interface, regroupées par fonctionnalité.
- `src/shared/` contient les composants, hooks et styles réutilisables.
- `public/` contient le manifeste Owlbear et les assets publics.
- `docs/` contient la documentation d'architecture.

## Ajouter un nouveau module

1. Déclarer son identifiant dans `src/core/constants/ids.ts`.
2. Ajouter sa fiche dans `src/core/modules/moduleRegistry.ts`.
3. Créer un dossier dédié dans `src/features/` uniquement lorsque la fonctionnalité est réellement développée.
4. Garder les types propres au module dans son dossier de feature, sauf s'ils deviennent globaux.
5. Passer par le registre des modules pour toute donnée affichée dans le Core.

## Règles importantes

- Ne jamais mélanger les données Calendar, Loot Table, Initiative, Stats et Range dans un même fichier ou dossier.
- Le Core ne doit contenir que les fondations communes : navigation, paramètres locaux, registre et intégration Owlbear minimale.
- Les préférences V1 sont stockées en `localStorage`; les metadata Owlbear sont réservées à de futurs usages partagés en room.
- `App.tsx` reste limité au shell, à la navigation et au routage interne simple.

## Bloc 2 — Initiative Tracker V1

Le code spécifique à l'initiative vit dans `src/features/initiative/` avec ses composants, hooks et services dédiés. Le stockage utilise les metadata Owlbear quand la room est prête, puis `localStorage` en fallback hors Owlbear. Les modules Distance, Stats, Calendar et Loot Table restent uniquement déclarés dans le registre tant que leurs blocs ne sont pas développés.


## Bloc 3 — Distance / Déplacement / Portée V1

Le code spécifique aux distances et portées vit dans `src/features/range/`. Il mesure et interprète des distances entre items Owlbear sans développer le Stat Tracker, Calendar, Loot Table, ni automatiser les attaques ou dégâts.


## Bloc 4 — Stat Tracker graphique avancé V1

Le code spécifique au suivi de statistiques vit dans `src/features/stats/`. Cette V1 reste un outil MJ visuel pour PV, CA, conditions, ressources et notes, sans automatiser les règles PF2e, les dégâts, Calendar ou Loot Table.

## État V1 stabilisé

### Modules intégrés

- Core / Dashboard : shell, navigation, paramètres locaux et registre de modules.
- Initiative Tracker V1 : suivi manuel de participants, rounds, tours et import contextuel Owlbear.
- Distance / Déplacement / Portée V1 : mesures entre items Owlbear, presets de portée et préférences locales.
- Stat Tracker V1 : suivi visuel MJ des PV, CA, conditions, ressources simples et notes.

### Modules reportés

Calendar et Loot Table sont reportés à plus tard car ils existent déjà en standalone et ne doivent pas être intégrés tant que les fondations tactiques ne sont pas stabilisées.

### Règles d'architecture

- Garder la séparation stricte `src/core/`, `src/features/` et `src/shared/`.
- Chaque feature conserve ses types, hooks, services et composants dans son propre dossier.
- Ne pas créer de dossier `utils` fourre-tout.
- `App.tsx` reste limité au routage interne et au shell.
- Ne pas fusionner Initiative, Range et Stats.

### Règles de stockage

- Les préférences personnelles restent en `localStorage`.
- Les états actifs partagés peuvent utiliser les metadata Owlbear si leur taille reste raisonnable.
- Ne pas stocker d'historique lourd, de logs de dégâts ou de gros statblocks.
- Toute lecture doit rester robuste si la donnée est absente ou invalide.

### Règles Owlbear

- Les hooks Owlbear doivent no-op hors Owlbear et nettoyer leurs abonnements.
- Les menus contextuels doivent être créés uniquement quand OBR est prêt.
- Les erreurs de scène, grille, bounds ou item sans nom ne doivent pas faire crasher l'application.

### Avant d'ajouter un nouveau module

1. Vérifier que `npm run typecheck` et `npm run build` passent.
2. Ajouter les IDs et clés nécessaires dans `src/core/constants/ids.ts`.
3. Créer un dossier de feature dédié.
4. Documenter la frontière du module dans ce fichier.
5. Confirmer que Calendar et Loot Table restent reportés tant que leur intégration n'est pas explicitement demandée.
