/**
 * WS-051 / GP §3.2.3–3.2.4 — tunables for chord buffer, sequences, jump coyote.
 * Adjust with playtests; keep in one place for designer-facing iteration.
 */
export const INPUT_COMBAT = {
  /**
   * After leaving ground, jump still accepts **one** latch for this many seconds.
   * GP §3.2.3 coyote time.
   */
  jumpCoyoteSec: 0.12,
  /**
   * Two **ordered** limb press edges within this window form a sequence move
   * (GP §3.2.4). Measured in seconds (`performance.now()` scale in bootstrap).
   */
  sequenceChainSec: 0.28,
} as const;
