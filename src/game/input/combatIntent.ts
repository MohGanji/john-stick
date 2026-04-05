/**
 * WS-051 / GP §3.2.3–3.2.4 — **combat intent** after priority + chord/sequence rules.
 *
 * ## Conflict priority (highest wins)
 * 1. **Interact** — `interactModeOpen`: limb combat intent cleared (sign/UI owns the moment;
 *    locomotion freeze stays in `bootstrap.ts`). Raw keys still read in `ActionMapSnapshot`.
 * 2. **Defensive** — **Shift** + limb (`guard*` / `dock*`): no attack move id; guards/docks pass through.
 * 3. **Simultaneous hold chord** — two or more `attack*` holds → compound `MoveId` (WS-081 expands table).
 * 4. **Ordered sequence** — two distinct limb **press edges** within `INPUT_COMBAT.sequenceChainSec`.
 * 5. **Base attack** — exactly one `attack*` hold → single-limb `MoveId`.
 * 6. **Idle** — none of the above.
 *
 * Simultaneous chord beats a sequence resolved on the same frame if both qualify.
 */
import type { ActionMapSnapshot, LimbId } from "./actionMap";
import { INPUT_COMBAT } from "./inputCombatConstants";

export type MoveId =
  | "none"
  | "atk_lp"
  | "atk_rp"
  | "atk_lk"
  | "atk_rk"
  | "chord_dual_punch"
  | "chord_dual_kick"
  | "chord_mixed_pi_lk"
  | "chord_mixed_pi_rk"
  | "chord_mixed_pu_lk"
  | "chord_mixed_pu_rk"
  | "chord_triple"
  | "chord_quad"
  | "seq_lp_rp"
  | "seq_rp_lp"
  | "seq_lk_rk"
  | "seq_rk_lk"
  | "seq_lp_lk"
  | "seq_lp_rk"
  | "seq_rp_lk"
  | "seq_rp_rk"
  | "seq_lk_lp"
  | "seq_lk_rp"
  | "seq_rk_lp"
  | "seq_rk_rp";

/** Any strike that can run the sphere sweep + cooldown row (`none` excluded). WS-080 + WS-081. */
export type StrikeMoveId = Exclude<MoveId, "none">;

export type CombatIntentPriority =
  | "interact"
  | "defensive"
  | "attack_hold_chord"
  | "attack_sequence"
  | "attack_base"
  | "idle";

export type ResolvedCombatIntent = {
  priority: CombatIntentPriority;
  /** Effective guard/dock (zeroed in interact mode). */
  guardLeft: boolean;
  guardRight: boolean;
  dockLeft: boolean;
  dockRight: boolean;
  /** Resolved strike id for anim / hit (WS-060+); `none` when not attacking. */
  attackMoveId: MoveId;
};

export type CombatIntentState = {
  /** First key of a candidate two-step sequence. */
  sequencePending: { limb: LimbId; timeSec: number } | null;
};

export function createCombatIntentState(): CombatIntentState {
  return { sequencePending: null };
}

const LIMB_IDS: LimbId[] = [
  "leftPunch",
  "rightPunch",
  "leftKick",
  "rightKick",
];

function attackHold(snapshot: ActionMapSnapshot, limb: LimbId): boolean {
  switch (limb) {
    case "leftPunch":
      return snapshot.attackLeftPunch;
    case "rightPunch":
      return snapshot.attackRightPunch;
    case "leftKick":
      return snapshot.attackLeftKick;
    case "rightKick":
      return snapshot.attackRightKick;
    default: {
      const _exhaustive: never = limb;
      return _exhaustive;
    }
  }
}

function attackMask(snapshot: ActionMapSnapshot): number {
  let m = 0;
  let bit = 1;
  for (const id of LIMB_IDS) {
    if (attackHold(snapshot, id)) m |= bit;
    bit <<= 1;
  }
  return m;
}

function popcountMask(mask: number): number {
  let n = 0;
  let m = mask;
  while (m) {
    n += m & 1;
    m >>>= 1;
  }
  return n;
}

/** Rising edge on attack path (Shift off already implied by `attack*`). */
function risingAttackEdges(
  prev: ActionMapSnapshot,
  curr: ActionMapSnapshot,
): LimbId[] {
  const out: LimbId[] = [];
  for (const id of LIMB_IDS) {
    if (attackHold(curr, id) && !attackHold(prev, id)) out.push(id);
  }
  return out;
}

function moveFromHoldMask(mask: number): MoveId {
  const c = popcountMask(mask);
  if (c <= 1) return "none";
  if (c === 4) return "chord_quad";
  if (c === 3) return "chord_triple";
  // c === 2
  if (mask === 0b0011) return "chord_dual_punch";
  if (mask === 0b1100) return "chord_dual_kick";
  if (mask === 0b0101) return "chord_mixed_pi_lk";
  if (mask === 0b1001) return "chord_mixed_pi_rk";
  if (mask === 0b0110) return "chord_mixed_pu_lk";
  if (mask === 0b1010) return "chord_mixed_pu_rk";
  return "chord_triple";
}

function baseMoveFromSingleLimb(limb: LimbId): MoveId {
  switch (limb) {
    case "leftPunch":
      return "atk_lp";
    case "rightPunch":
      return "atk_rp";
    case "leftKick":
      return "atk_lk";
    case "rightKick":
      return "atk_rk";
    default: {
      const _exhaustive: never = limb;
      return _exhaustive;
    }
  }
}

function sequenceMove(a: LimbId, b: LimbId): MoveId | null {
  const key = `${a},${b}`;
  const table: Record<string, MoveId> = {
    "leftPunch,rightPunch": "seq_lp_rp",
    "rightPunch,leftPunch": "seq_rp_lp",
    "leftKick,rightKick": "seq_lk_rk",
    "rightKick,leftKick": "seq_rk_lk",
    "leftPunch,leftKick": "seq_lp_lk",
    "leftPunch,rightKick": "seq_lp_rk",
    "rightPunch,leftKick": "seq_rp_lk",
    "rightPunch,rightKick": "seq_rp_rk",
    "leftKick,leftPunch": "seq_lk_lp",
    "leftKick,rightPunch": "seq_lk_rp",
    "rightKick,leftPunch": "seq_rk_lp",
    "rightKick,rightPunch": "seq_rk_rp",
  };
  return table[key] ?? null;
}

function zeroDefense(): Pick<
  ResolvedCombatIntent,
  "guardLeft" | "guardRight" | "dockLeft" | "dockRight"
> {
  return {
    guardLeft: false,
    guardRight: false,
    dockLeft: false,
    dockRight: false,
  };
}

function defenseFrom(snapshot: ActionMapSnapshot): Pick<
  ResolvedCombatIntent,
  "guardLeft" | "guardRight" | "dockLeft" | "dockRight"
> {
  return {
    guardLeft: snapshot.guardLeft,
    guardRight: snapshot.guardRight,
    dockLeft: snapshot.dockLeft,
    dockRight: snapshot.dockRight,
  };
}

/**
 * Advance buffered sequence state and produce this frame’s resolved intent.
 * Call once per **render** frame after sampling `curr` and retaining `prev`.
 */
export function resolveCombatIntent(
  state: CombatIntentState,
  prev: ActionMapSnapshot,
  curr: ActionMapSnapshot,
  nowSec: number,
): { resolved: ResolvedCombatIntent; nextState: CombatIntentState } {
  const chain = INPUT_COMBAT.sequenceChainSec;

  if (curr.interactModeOpen) {
    return {
      resolved: {
        priority: "interact",
        ...zeroDefense(),
        attackMoveId: "none",
      },
      nextState: { sequencePending: null },
    };
  }

  if (curr.shiftHeld) {
    return {
      resolved: {
        priority: "defensive",
        ...defenseFrom(curr),
        attackMoveId: "none",
      },
      nextState: { sequencePending: null },
    };
  }

  let sequencePending = state.sequencePending;
  if (sequencePending !== null && nowSec - sequencePending.timeSec > chain) {
    sequencePending = null;
  }

  const mask = attackMask(curr);
  const holds = popcountMask(mask);

  if (holds >= 2) {
    return {
      resolved: {
        priority: "attack_hold_chord",
        ...zeroDefense(),
        attackMoveId: moveFromHoldMask(mask),
      },
      nextState: { sequencePending: null },
    };
  }

  let sequenceMoveId: MoveId | null = null;
  const edges = risingAttackEdges(prev, curr);
  for (const limb of edges) {
    if (sequencePending !== null) {
      const dt = nowSec - sequencePending.timeSec;
      if (dt <= chain && sequencePending.limb !== limb) {
        const seq = sequenceMove(sequencePending.limb, limb);
        if (seq !== null) {
          sequenceMoveId = seq;
          sequencePending = null;
          break;
        }
      }
    }
    if (sequenceMoveId === null) {
      sequencePending = { limb, timeSec: nowSec };
    }
  }

  if (sequenceMoveId !== null) {
    return {
      resolved: {
        priority: "attack_sequence",
        ...zeroDefense(),
        attackMoveId: sequenceMoveId,
      },
      nextState: { sequencePending },
    };
  }

  if (holds === 1) {
    const heldLimb = LIMB_IDS.find((id) => attackHold(curr, id))!;
    return {
      resolved: {
        priority: "attack_base",
        ...zeroDefense(),
        attackMoveId: baseMoveFromSingleLimb(heldLimb),
      },
      nextState: { sequencePending },
    };
  }

  return {
    resolved: {
      priority: "idle",
      ...zeroDefense(),
      attackMoveId: "none",
    },
    nextState: { sequencePending },
  };
}
