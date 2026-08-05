import * as THREE from "three";

export const GUNMETAL_CORE_PROFILE = [
  new THREE.Vector2(0, -0.18),
  new THREE.Vector2(0.75, -0.18),
  new THREE.Vector2(0.81, -0.15),
  new THREE.Vector2(0.83, -0.09),
  new THREE.Vector2(0.83, 0.26),
  new THREE.Vector2(0.81, 0.35),
  new THREE.Vector2(0.74, 0.42),
  new THREE.Vector2(0.6, 0.5),
  new THREE.Vector2(0.35, 0.54),
  new THREE.Vector2(0, 0.55),
];

export const PENDANT_SCALE = 0.75;
export const PENDANT_DROP = 1.15 * PENDANT_SCALE;
export const PRODUCT_YAW = -Math.PI / 4;

export function createGrainTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function updateGrainTexture(
  texture: THREE.DataTexture,
  repeat: number,
  contrast: number,
  initialSeed = 0x5f3759df,
) {
  const data = texture.image.data as Uint8Array;
  let seed = (initialSeed ^ 0x5f3759df) >>> 0;
  for (let index = 0; index < data.length / 4; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = (seed >>> 24) / 255 - 0.5;
    const value = THREE.MathUtils.clamp(128 + noise * 255 * contrast, 0, 255);
    const offset = index * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }
  texture.repeat.set(repeat, repeat);
  texture.needsUpdate = true;
}
