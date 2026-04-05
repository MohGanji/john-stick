/**
 * WS-060 / GP §6.2.1 — hit probe + training hurt volume tuning (gameplay programmer).
 * Left punch profile is owned by the WS-080 designer table (`baseMoveTable.ts`).
 */
import { playerCapsuleCenterY } from "../player/playerCapsuleConfig";
import { baseMoveProfile } from "./baseMoveTable";

export const LEFT_PUNCH_HIT = baseMoveProfile("atk_lp");

/** World-space AABB for the dojo training bag hurt sensor (shared: Rapier + debug draw). */
export const TRAINING_HURT_VOLUME = {
  center: { x: 0, y: 1.05, z: 6 },
  /** Default rest pose at spawn; hurt collider is on the swinging bag — center moves with it. */
  /** Wider x / larger z radius = fatter capsule; y sets overall vertical span with `punchingBagConfig` math. */
  halfExtents: { x: 0.54, y: 0.96, z: 0.34 },
} as const;

/**
 * WS-090 / GP §2.1.2 — training dummy hurt sensor (parented to dynamic body; moves/tilts with it).
 * Center Y matches hero capsule feet-on-floor (`playerCapsuleCenterY`).
 */
export const TRAINING_DUMMY_HURT_VOLUME = {
  center: { x: 5.2, y: playerCapsuleCenterY(), z: 3.35 },
  /** Torso-sized box around the player-scale capsule (sensor only). */
  halfExtents: { x: 0.28, y: 0.74, z: 0.26 },
} as const;
