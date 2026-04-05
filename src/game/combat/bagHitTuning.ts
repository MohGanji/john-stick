/**
 * WS-062 / GP §2.4.1, §6.2.2 — punching bag as **lab**: impulse + abstract damage, tier multipliers.
 * Lead Game Designer owns the numbers; gameplay applies them on hit.
 *
 * `impulseTierMultipliers[0]` is the default (base limb taps). Higher indices are reserved
 * for charged or heavy compound rows when WS-081 wires hold time / `MoveId` into the resolver.
 */
export const BAG_HIT_TUNING = {
  /**
   * Horizontal push magnitude (impulse units, same scale as WS-061 bag tests).
   * Applied along **player → bag** direction on XZ.
   */
  basePlanarImpulse: 248,
  /** Small upward component so the jointed bag swings rather than only sliding in XZ. */
  upwardImpulse: 32,
  /** Abstract lab damage per connect (no UI in WS-062; feeds future scoring / dummy tiers). */
  baseDamage: 10,
  /** Multiplier per tier index; clamped in `bagImpulseDamageTierMultiplier`. */
  impulseTierMultipliers: [1, 1.38, 1.82] as const,
  damageTierMultipliers: [1, 1.25, 1.55] as const,
} as const;

export function bagImpulseDamageTierMultiplier(tierIndex: number): number {
  const m = BAG_HIT_TUNING.impulseTierMultipliers;
  const i = Math.max(0, Math.min(m.length - 1, Math.floor(tierIndex)));
  return m[i]!;
}

export function bagDamageTierMultiplier(tierIndex: number): number {
  const m = BAG_HIT_TUNING.damageTierMultipliers;
  const i = Math.max(0, Math.min(m.length - 1, Math.floor(tierIndex)));
  return m[i]!;
}
