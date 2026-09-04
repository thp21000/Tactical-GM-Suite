# TOKEN_PLAYER_ASSIGNMENT

> Fondation transversale — Tactical GM Suite  
> Mise en place : 4 septembre 2026

## Objectif

Le lien entre un token Owlbear Rodeo et un joueur de la room n'appartient plus au Stat Tracker.

Il s'agit désormais d'une donnée Core utilisable par tous les modules :

```text
token Owlbear
  -> assignation joueur Core
       -> Stats
       -> Conditions privées
       -> futurs modules qui en ont besoin
```

Un token peut donc être lié à un joueur sans être ajouté au Stat Tracker.

## Source de vérité

Service :

```text
src/core/tokens/tokenPlayerAssignment.ts
```

Métadonnée Owlbear :

```text
fr.quentin.tactical-gm-suite/token-player-assignment
```

Schéma V1 :

```ts
{
  version: 1,
  playerId?: string,
  playerName?: string,
  updatedAt: string
}
```

L'état « lié à personne » est lui aussi persisté explicitement. Cela évite qu'un ancien snapshot de module puisse réintroduire une assignation supprimée.

## Interface

Owlbear Rodeo ne fournit pas de sous-menu contextuel natif imbriqué aux extensions. Tactical GM Suite utilise donc un item Context Menu `Tactical GM Suite` qui ouvre un petit popover ancré à cet item.

Ce popover est volontairement un menu d'actions compact, pas une interface de module.

Actions V1 :

```text
Ajouter au Stat Tracker / Retirer du Stat Tracker
Lié à personne / Lié à <nom du joueur>
```

La seconde ligne ouvre la liste des joueurs `PLAYER` présents dans la room ainsi qu'une option pour supprimer l'assignation.

## Intégration Stats

L'ancien sélecteur `Joueur assigné` est retiré du formulaire Stats.

Stats continue à utiliser l'assignation pour :

- `canPlayerEdit` ;
- les trackers privés ;
- le menu Stats rapide joueur ;
- les permissions existantes qui dépendent du propriétaire du token.

Le profil Stats conserve temporairement un miroir `assignedPlayerId` / `assignedPlayerName` afin de ne pas casser le moteur de permissions actuel, mais il n'est plus la source de vérité.

Lorsqu'un lien Core est modifié, le miroir Stats est mis à jour si un profil Stats/Conditions existe déjà.

Lorsqu'un token lié à un joueur est ajouté au Stat Tracker pour la première fois, le nouveau profil Stats récupère l'assignation Core.

## Conditions sans Stat Tracker

Un token non suivi par Stats peut être assigné à un joueur puis recevoir des Conditions. Le profil dormant utilisé pour stocker les Conditions reprend alors l'assignation Core.

## Migration

Les anciennes assignations qui existaient uniquement dans les profils Stats sont reprises automatiquement vers la métadonnée Core lors du chargement de la scène par le MJ.

Cette migration est uniquement un pont depuis l'implémentation actuelle. Les nouvelles fonctions ne doivent pas recommencer à écrire une assignation propriétaire dans un autre module.

## Règle pour les futurs modules

Un nouveau module qui a besoin de savoir à quel joueur appartient un token doit lire le service Core :

```text
readTokenPlayerAssignment(item)
```

Il ne doit pas lire directement le profil Stats et ne doit pas créer son propre système d'assignation parallèle.
