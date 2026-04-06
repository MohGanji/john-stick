import { describe, expect, it } from "vitest";

import {
  DOJO_SIGN_KIOSK_SPECS,
  getDojoSignReadPromptState,
  isPlayerFacingPointXZ,
  isPlayerInAnyDojoSignVolume,
  resolveNearestDojoSignKioskIndex,
} from "./dojoSignKiosks";

describe("isPlayerInAnyDojoSignVolume", () => {
  const vols = DOJO_SIGN_KIOSK_SPECS.map((s) => ({
    x: s.x,
    z: s.z,
    yMin: 0,
    yMax: 2.15,
    radiusXZ: 1.2,
  }));

  it("is true at first kiosk footpoint with capsule center height", () => {
    const k = DOJO_SIGN_KIOSK_SPECS[0];
    expect(
      isPlayerInAnyDojoSignVolume(k.x, 0.85, k.z, vols),
    ).toBe(true);
  });

  it("is false far from both kiosks", () => {
    expect(isPlayerInAnyDojoSignVolume(0, 0.85, 0, vols)).toBe(false);
  });

  it("is false when vertical span misses player center", () => {
    const k = DOJO_SIGN_KIOSK_SPECS[0];
    expect(isPlayerInAnyDojoSignVolume(k.x, 3, k.z, vols)).toBe(false);
  });

  it("resolveNearest picks the closer kiosk when both overlap (degenerate)", () => {
    const k0 = DOJO_SIGN_KIOSK_SPECS[0];
    expect(resolveNearestDojoSignKioskIndex(k0.x, 0.85, k0.z, vols)).toBe(0);
  });
});

describe("isPlayerFacingPointXZ", () => {
  const half = 0.55;
  it("true when target straight ahead (+Z at yaw 0)", () => {
    expect(isPlayerFacingPointXZ(0, 0, 0, 0, 3, half)).toBe(true);
  });
  it("false when target is behind", () => {
    expect(isPlayerFacingPointXZ(0, 0, 0, 0, -4, half)).toBe(false);
  });
});

describe("getDojoSignReadPromptState", () => {
  const vols = DOJO_SIGN_KIOSK_SPECS.map((s) => ({
    x: s.x,
    z: s.z,
    yMin: 0,
    yMax: 2.15,
    radiusXZ: 1.2,
  }));

  it("inRange+facingSign inside volume with yaw toward kiosk", () => {
    const k0 = DOJO_SIGN_KIOSK_SPECS[0];
    const px = k0.x - 0.65;
    const pz = k0.z + 0.15;
    const yaw = Math.atan2(k0.x - px, k0.z - pz);
    const s = getDojoSignReadPromptState({
      px,
      py: 0.85,
      pz,
      facingYawRad: yaw,
      volumes: vols,
    });
    expect(s.inRange).toBe(true);
    expect(s.facingSign).toBe(true);
  });
});
