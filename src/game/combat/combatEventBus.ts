/**
 * WS-070 / GP §4.3.3 — typed combat events for audio, VFX, hit-stop, UI (subscribe from any layer).
 *
 * Listeners run in the same stack as `emit` (typically `fixedStep` after hit resolution). Keep work
 * O(1); defer rendering or Web Audio graph changes to `lateUpdate` / `update` if needed.
 */
import type { BaseAttackMoveId } from "./baseMoveTable";

export type CombatHitTargetKind = "training_bag";

/** Base limb strikes (WS-080); compounds add more ids with WS-081. */
export type CombatHitAttackKind =
  | "left_punch"
  | "right_punch"
  | "left_kick"
  | "right_kick";

export function combatHitAttackKindForBaseMove(
  moveId: BaseAttackMoveId,
): CombatHitAttackKind {
  switch (moveId) {
    case "atk_lp":
      return "left_punch";
    case "atk_rp":
      return "right_punch";
    case "atk_lk":
      return "left_kick";
    case "atk_rk":
      return "right_kick";
    default: {
      const _exhaustive: never = moveId;
      return _exhaustive;
    }
  }
}

/**
 * One successful strike → target resolution (damage + impulse already applied in physics).
 */
export type CombatHit = {
  readonly attackKind: CombatHitAttackKind;
  readonly targetKind: CombatHitTargetKind;
  readonly damageDealt: number;
  readonly impulseWorld: { x: number; y: number; z: number };
  /** World-space contact / fist sample used for the hit (SFX/VFX placement). */
  readonly contactWorld: { x: number; y: number; z: number };
  readonly chargeTierIndex: number;
};

/** Extend with `combat_blocked`, whiff markers, etc., as FSMs land (GP §4.3.3). */
export type CombatEvent = { type: "combat_hit"; hit: CombatHit };

export type CombatEventListener = (event: CombatEvent) => void;

export type CombatEventBus = {
  subscribe(listener: CombatEventListener): () => void;
  emit(event: CombatEvent): void;
};

export function createCombatEventBus(): CombatEventBus {
  const listeners = new Set<CombatEventListener>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(event) {
      for (const fn of listeners) {
        fn(event);
      }
    },
  };
}
