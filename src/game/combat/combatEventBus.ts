/**
 * WS-070 / GP §4.3.3 — typed combat events for audio, VFX, hit-stop, UI (subscribe from any layer).
 *
 * Listeners run in the same stack as `emit` (typically `fixedStep` after hit resolution). Keep work
 * O(1); defer rendering or Web Audio graph changes to `lateUpdate` / `update` if needed.
 */
export type CombatHitTargetKind = "training_bag";

/** Strike family that connected (expand with `MoveId` / clip ids as attacks grow). */
export type CombatHitAttackKind = "left_punch";

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
