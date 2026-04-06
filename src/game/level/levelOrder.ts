/**
 * WS-112 / GP §2.5.1–2.5.2 — **client-only** level order; load / restart / next without a server.
 * Extra runs use `?level=<index>` on the page URL (static-host friendly).
 */

/** Ordered list of shipped level ids (dojo first). Append entries as levels land. */
export const LEVEL_ORDER = ["dojo"] as const;

export type LevelId = (typeof LEVEL_ORDER)[number];

export function parseLevelIndexFromSearch(search: string): number {
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  const raw = new URLSearchParams(trimmed).get("level");
  if (raw === null) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LEVEL_ORDER.length - 1);
}

export function readLevelIndexFromLocation(): number {
  return parseLevelIndexFromSearch(window.location.search);
}

export function buildHrefWithLevelIndex(
  currentHref: string,
  index: number,
): string {
  const u = new URL(currentHref);
  u.searchParams.set("level", String(index));
  return u.href;
}

/** True when `levelIndex + 1` is still a valid slot in `LEVEL_ORDER`. */
export function hasNextLevel(levelIndex: number): boolean {
  return levelIndex + 1 < LEVEL_ORDER.length;
}
