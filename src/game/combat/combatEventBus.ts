/**
 * WS-070 / GP §4.3.3 — typed combat events for audio, VFX, hit-stop, UI (subscribe from any layer).
 *
 * Listeners run in the same stack as `emit` (typically `fixedStep` after hit resolution). Keep work
 * O(1); defer rendering or Web Audio graph changes to `lateUpdate` / `update` if needed.
 */
import type { StrikeMoveId } from "../input/combatIntent";

export type CombatHitTargetKind = "training_bag";

/**
 * Audio / VFX buckets — base limbs (WS-080) plus compound families (WS-081).
 * Finer per-`MoveId` mapping can replace these buckets when assets need it.
 */
export type CombatHitAttackKind =
  | "left_punch"
  | "right_punch"
  | "left_kick"
  | "right_kick"
  | "compound_dual_punch"
  | "compound_dual_kick"
  | "compound_mixed"
  | "compound_multi"
  | "sequence_strike";

export function combatHitAttackKindForStrike(moveId: StrikeMoveId): CombatHitAttackKind {
  switch (moveId) {
    case "atk_lp":
      return "left_punch";
    case "atk_rp":
      return "right_punch";
    case "atk_lk":
      return "left_kick";
    case "atk_rk":
      return "right_kick";
    case "chord_dual_punch":
      return "compound_dual_punch";
    case "chord_dual_kick":
      return "compound_dual_kick";
    case "chord_mixed_pi_lk":
    case "chord_mixed_pi_rk":
    case "chord_mixed_pu_lk":
    case "chord_mixed_pu_rk":
      return "compound_mixed";
    case "chord_triple":
    case "chord_quad":
      return "compound_multi";
    case "seq_lp_rp":
    case "seq_rp_lp":
    case "seq_lk_rk":
    case "seq_rk_lk":
    case "seq_lp_lk":
    case "seq_lp_rk":
    case "seq_rp_lk":
    case "seq_rp_rk":
    case "seq_lk_lp":
    case "seq_lk_rp":
    case "seq_rk_lp":
    case "seq_rk_rp":
      return "sequence_strike";
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
