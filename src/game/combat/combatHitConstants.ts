/**
 * WS-060 / GP §6.2.1 — hit probe + training hurt volume tuning (gameplay programmer).
 * Left punch profile is owned by the WS-080 designer table (`baseMoveTable.ts`).
 */
import { baseMoveProfile } from "./baseMoveTable";

export const LEFT_PUNCH_HIT = baseMoveProfile("atk_lp");

/** World-space AABB for the dojo training bag hurt sensor (shared: Rapier + debug draw). */
export const TRAINING_HURT_VOLUME = {
  center: { x: 0, y: 1.05, z: 6 },
  /** Default rest pose at spawn; hurt collider is on the swinging bag — center moves with it. */
  /** Wider x / larger z radius = fatter capsule; y sets overall vertical span with `punchingBagConfig` math. */
  halfExtents: { x: 0.54, y: 0.96, z: 0.34 },
} as const;
