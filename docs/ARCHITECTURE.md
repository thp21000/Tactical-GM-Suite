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
