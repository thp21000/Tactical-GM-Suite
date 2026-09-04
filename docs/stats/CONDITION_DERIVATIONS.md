# Automatic condition derivations

Status: runtime design for Tactical GM Suite 0.3.22.

Scope: D&D 5e 2014 / SRD 5.1 and Pathfinder 2e Remaster / Player Core.

## Principle

Tactical GM Suite only automates a secondary condition when the rules of the selected system directly establish that relationship. Circumstantial effects, relative detection states and rules that depend on another creature are left manual.

Two runtime modes exist:

- `while-active`: the secondary condition is maintained while at least one active source requires it. Removing one source does not remove the secondary condition if another source still maintains it. A manually-added copy also remains independent.
- `on-apply`: the secondary condition is added when the source becomes active, then becomes independent. It can therefore be removed separately and is not continuously re-applied while the source remains active.

This distinction exists specifically to avoid the incorrect rule “every automatic child is locked until its parent disappears”.

Conditions created automatically carry `isExplicit: false` plus `derivedFrom[]`. Older conditions without this metadata are treated as explicit/manual conditions.

## D&D 5e 2014

| Source | Secondary condition | Mode | Reason |
|---|---|---|---|
| Paralyzed | Incapacitated | `while-active` | Paralyzed explicitly includes Incapacitated. |
| Petrified | Incapacitated | `while-active` | Petrified explicitly includes Incapacitated. |
| Stunned | Incapacitated | `while-active` | Stunned explicitly includes Incapacitated. |
| Unconscious | Incapacitated | `while-active` | Unconscious explicitly includes Incapacitated. |
| Unconscious | Prone | `on-apply` | Gaining Unconscious makes the creature fall prone; Prone can outlive Unconscious. |

Not automated: Grappled ending because the grappler becomes incapacitated. That is a cross-token/source relationship and requires knowing which creature/effect imposed the grapple.

Reference: D&D Basic Rules 2014, Appendix A: Conditions / SRD 5.1.

## Pathfinder 2e Remaster

| Source | Secondary condition | Mode | Reason |
|---|---|---|---|
| Confused | Off-Guard | `while-active` | Confused explicitly makes the creature off-guard. |
| Grabbed (`grappled`) | Off-Guard | `while-active` | Grabbed explicitly includes Off-Guard. |
| Grabbed (`grappled`) | Immobilized | `while-active` | Grabbed explicitly includes Immobilized. |
| Paralyzed | Off-Guard | `while-active` | Paralyzed explicitly includes Off-Guard. |
| Prone | Off-Guard | `while-active` | Prone explicitly makes the creature off-guard. |
| Restrained | Off-Guard | `while-active` | Restrained explicitly includes Off-Guard. |
| Restrained | Immobilized | `while-active` | Restrained explicitly includes Immobilized. |
| Unconscious | Blinded | `while-active` | Unconscious explicitly includes Blinded. |
| Unconscious | Off-Guard | `while-active` | Unconscious explicitly includes Off-Guard. |
| Unconscious | Prone | `on-apply` | Gaining Unconscious makes the creature fall prone. |
| Dying | Unconscious | `on-apply` | Dying applies Unconscious, but losing Dying at 0 HP can leave the creature Unconscious; it must not be blindly removed with Dying. |

`Dying -> Unconscious` is deliberately modeled conservatively as `on-apply`. Tactical GM Suite does not currently know the token's PF2e HP/death state well enough to decide whether Unconscious must remain or end when Dying changes. The user therefore retains manual control after the automatic application.

Not automated:

- Hidden, Undetected, Unnoticed and Invisible relationships because detection conditions are relative to another creature, not global states on the same token;
- Blinded indirectly making other creatures hidden/undetected from the blinded creature;
- Wounded changing the value of a future Dying condition;
- gaining/increasing Wounded when Dying ends;
- effects that only sometimes cause another condition;
- source-specific Escape interactions until Tactical GM Suite tracks which effect or creature imposed Grabbed/Immobilized/Restrained.

References: Pathfinder Player Core conditions and basic actions, mirrored by Archives of Nethys.

## Multiple sources

A secondary condition can have several automatic sources. Example in PF2e:

- a creature is Grabbed -> Off-Guard is automatic;
- the same creature also becomes Prone -> Off-Guard gains a second `while-active` source;
- removing Grabbed does not remove Off-Guard because Prone still requires it;
- removing Prone then removes the automatic Off-Guard unless Off-Guard was also explicitly added.

## Manual override

A condition may be both explicit and automatic. Editing an automatically present condition in the Conditions menu promotes it to an explicit condition while retaining its automatic sources. It will therefore survive the later disappearance of those sources.

For an `on-apply` child, direct removal is allowed even if the original source is still active. The source does not continuously re-apply it; it is applied again only after a genuine new activation of the source.

## UI

Automatic conditions are marked `AUTO` in the compact condition list metadata. No number or automatic marker is drawn on the token itself: the token overlay remains icon-only.
