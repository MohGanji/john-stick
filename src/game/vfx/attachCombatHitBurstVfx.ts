import * as THREE from "three";

import type { CombatJuiceAccess } from "../accessibility/combatJuiceAccess";
import type { CombatEventBus, CombatHit } from "../combat/combatEventBus";
import {
  fillHitBurstVertexColors,
  getHitBurstVfxPreset,
  HIT_BURST_VFX_MAX_PARTICLES,
  type HitBurstVfxStyleId,
} from "./hitBurstVfxPresets";

/**
 * WS-073 / GP §6.3.2 — additive spark burst at `contactWorld`, biased along `impulseWorld`.
 * Queued from the combat bus during `fixedStep`, spawned/integrated in `lateUpdate` (same pattern as WS-072 audio).
 *
 * Preset IDs come from dev tuning (`GameplayRuntimeTuning.vfx.hitBurstStyle`). Bursts respect
 * `cameraEffectsEnabled` unless `ignoreJuiceAccess` (dev preview only).
 */
const COMBAT_BURST_MAX = 8;

type QueuedSpawn = {
  hit: CombatHit;
  /** Dev HUD preview: show burst even when reduced-motion / camera juice is off. */
  ignoreJuiceAccess?: boolean;
};

function createSoftSparkParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("attachCombatHitBurstVfx: 2d context unavailable");
  }
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.28, "rgba(255,230,190,0.55)");
  g.addColorStop(1, "rgba(255,180,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

type BurstSlot = {
  group: THREE.Group;
  positions: THREE.BufferAttribute;
  colors: THREE.BufferAttribute;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  vel: Float32Array;
  active: boolean;
  age: number;
  particleCount: number;
  lifetimeSec: number;
  gravityY: number;
};

export function attachCombatHitBurstVfx(input: {
  scene: THREE.Scene;
  combatEvents: CombatEventBus;
  getJuiceAccess: () => CombatJuiceAccess;
  getHitBurstStyle: () => HitBurstVfxStyleId;
}): {
  flushQueuedSpawns: () => void;
  update: (dtSec: number) => void;
  enqueuePreviewHit: (hit: CombatHit) => void;
  dispose: () => void;
} {
  const queue: QueuedSpawn[] = [];
  const off = input.combatEvents.subscribe((ev) => {
    if (ev.type !== "combat_hit") return;
    queue.push({ hit: ev.hit });
  });

  const texture = createSoftSparkParticleTexture();
  const dir = new THREE.Vector3();
  const aux = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  const slots: BurstSlot[] = [];
  for (let s = 0; s < COMBAT_BURST_MAX; s++) {
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(HIT_BURST_VFX_MAX_PARTICLES * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const colArray = new Float32Array(HIT_BURST_VFX_MAX_PARTICLES * 3);
    geometry.setAttribute("color", new THREE.BufferAttribute(colArray, 3));
    geometry.setDrawRange(0, HIT_BURST_VFX_MAX_PARTICLES);

    const material = new THREE.PointsMaterial({
      map: texture,
      size: 0.082,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      opacity: 1,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 6;

    const group = new THREE.Group();
    group.visible = false;
    group.add(points);
    input.scene.add(group);

    slots.push({
      group,
      positions: geometry.attributes.position as THREE.BufferAttribute,
      colors: geometry.attributes.color as THREE.BufferAttribute,
      geometry,
      material,
      vel: new Float32Array(HIT_BURST_VFX_MAX_PARTICLES * 3),
      active: false,
      age: 0,
      particleCount: HIT_BURST_VFX_MAX_PARTICLES,
      lifetimeSec: 0.38,
      gravityY: -2.1,
    });
  }

  function stealSlot(): BurstSlot {
    let fallback = slots[0]!;
    let maxAge = -1;
    for (const slot of slots) {
      if (!slot.active) return slot;
      if (slot.age > maxAge) {
        maxAge = slot.age;
        fallback = slot;
      }
    }
    return fallback;
  }

  function spawn(item: QueuedSpawn): void {
    const { hit, ignoreJuiceAccess } = item;
    if (!ignoreJuiceAccess && !input.getJuiceAccess().cameraEffectsEnabled) {
      return;
    }

    const preset = getHitBurstVfxPreset(input.getHitBurstStyle());
    const particleCount = Math.min(
      preset.particleCount,
      HIT_BURST_VFX_MAX_PARTICLES,
    );

    const { impulseWorld, contactWorld } = hit;
    const ix = impulseWorld.x;
    const iy = impulseWorld.y;
    const iz = impulseWorld.z;
    let len = Math.hypot(ix, iy, iz);
    if (len < 1e-5) {
      dir.set(0, 0.45, 1).normalize();
    } else {
      dir.set(ix / len, iy / len, iz / len);
    }

    aux.set(0, 1, 0).cross(dir);
    if (aux.lengthSq() < 1e-8) {
      aux.set(1, 0, 0).cross(dir);
    }
    right.copy(aux).normalize();
    up.crossVectors(right, dir).normalize();

    const slot = stealSlot();
    slot.active = true;
    slot.age = 0;
    slot.particleCount = particleCount;
    slot.lifetimeSec = preset.lifetimeSec;
    slot.gravityY = preset.gravityY;
    slot.material.opacity = 1;
    slot.material.size = preset.particleSize;
    slot.geometry.setDrawRange(0, particleCount);
    slot.group.position.set(contactWorld.x, contactWorld.y, contactWorld.z);
    slot.group.visible = true;

    const col = slot.colors.array as Float32Array;
    fillHitBurstVertexColors(col, particleCount, preset.colorRand);
    slot.colors.needsUpdate = true;

    const pos = slot.positions.array as Float32Array;
    const vel = slot.vel;
    const jitter = preset.spawnJitter;
    const spread = preset.spread;
    for (let p = 0; p < particleCount; p++) {
      const o = p * 3;
      pos[o] = (Math.random() - 0.5) * 2 * jitter;
      pos[o + 1] = (Math.random() - 0.5) * 2 * jitter;
      pos[o + 2] = (Math.random() - 0.5) * 2 * jitter;

      const rx = (Math.random() - 0.5) * 2 * spread;
      const ry = (Math.random() - 0.5) * 2 * spread;
      let vx = dir.x + right.x * rx + up.x * ry;
      let vy = dir.y + right.y * rx + up.y * ry;
      let vz = dir.z + right.z * rx + up.z * ry;
      const vlen = Math.hypot(vx, vy, vz) || 1;
      vx /= vlen;
      vy /= vlen;
      vz /= vlen;
      const speed =
        preset.speedMin +
        Math.random() * (preset.speedMax - preset.speedMin);
      vel[o] = vx * speed;
      vel[o + 1] = vy * speed;
      vel[o + 2] = vz * speed;
    }
    slot.positions.needsUpdate = true;
  }

  return {
    flushQueuedSpawns() {
      while (queue.length > 0) {
        spawn(queue.shift()!);
      }
    },
    update(dtSec: number) {
      for (const slot of slots) {
        if (!slot.active) continue;
        slot.age += dtSec;
        const life = slot.lifetimeSec;
        if (slot.age >= life) {
          slot.active = false;
          slot.group.visible = false;
          continue;
        }
        const u = slot.age / life;
        slot.material.opacity = 1 - u * u;

        const n = slot.particleCount;
        const pos = slot.positions.array as Float32Array;
        const vel = slot.vel;
        const g = slot.gravityY;
        for (let p = 0; p < n; p++) {
          const o = p * 3;
          vel[o + 1] += g * dtSec;
          pos[o] += vel[o] * dtSec;
          pos[o + 1] += vel[o + 1] * dtSec;
          pos[o + 2] += vel[o + 2] * dtSec;
        }
        slot.positions.needsUpdate = true;
      }
    },
    enqueuePreviewHit(hit: CombatHit) {
      queue.push({ hit, ignoreJuiceAccess: true });
    },
    dispose() {
      off();
      queue.length = 0;
      texture.dispose();
      for (const slot of slots) {
        slot.geometry.dispose();
        slot.material.dispose();
        input.scene.remove(slot.group);
      }
    },
  };
}
