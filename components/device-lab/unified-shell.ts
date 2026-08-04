import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const BODY_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0, -0.34], [0.48, -0.34], [0.76, -0.3], [0.94, -0.2],
  [1.01, -0.07], [1.02, 0.04], [0.98, 0.17], [0.85, 0.3],
  [0.57, 0.39], [0, 0.41],
];

const BAIL_BLEND_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0, 0.72], [0.12, 0.73], [0.22, 0.78], [0.27, 0.86],
  [0.24, 0.94], [0.18, 1], [0.13, 1.06], [0.095, 1.12], [0, 1.13],
];

const GRID_RESOLUTION = 112;
const MAX_POLYGON_COUNT = 160_000;
const BOUNDS_MIN = new THREE.Vector3(-1.2, -1.2, -0.5);
const BOUNDS_MAX = new THREE.Vector3(1.2, 1.54, 0.64);

function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denominator = abx * abx + aby * aby;
  const t = denominator === 0
    ? 0
    : THREE.MathUtils.clamp((apx * abx + apy * aby) / denominator, 0, 1);
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function revolvedProfileSdf(
  radial: number,
  axial: number,
  profile: ReadonlyArray<readonly [number, number]>,
) {
  let inside = false;
  let distance = Number.POSITIVE_INFINITY;

  for (
    let index = 0, previous = profile.length - 1;
    index < profile.length;
    previous = index, index += 1
  ) {
    const [ax, ay] = profile[previous];
    const [bx, by] = profile[index];
    distance = Math.min(
      distance,
      pointSegmentDistance(radial, axial, ax, ay, bx, by),
    );

    if ((ay > axial) !== (by > axial)) {
      const intersection = ax + ((ax - bx) * (axial - ay)) / (ay - by);
      if (radial < intersection) inside = !inside;
    }
  }

  return inside ? -distance : distance;
}

function ellipsoidSdf(
  x: number,
  y: number,
  z: number,
  radiusX: number,
  radiusY: number,
  radiusZ: number,
) {
  const normalizedLength = Math.hypot(x / radiusX, y / radiusY, z / radiusZ);
  const gradientLength = Math.hypot(
    x / (radiusX * radiusX),
    y / (radiusY * radiusY),
    z / (radiusZ * radiusZ),
  );
  if (gradientLength < 1e-6) return -Math.min(radiusX, radiusY, radiusZ);
  return (normalizedLength * (normalizedLength - 1)) / gradientLength;
}

function bailTorusSdf(x: number, y: number, z: number) {
  const translatedX = x;
  const translatedY = y - 1.08;
  const translatedZ = z - 0.015;
  const localX = -translatedZ / 0.78;
  const localY = translatedY / 1.32;
  const localZ = translatedX / 0.82;
  const ringDistance = Math.hypot(localX, localY) - 0.16;
  return (Math.hypot(ringDistance, localZ) - 0.105) * 0.78;
}

function smoothUnion(first: number, second: number, radius: number) {
  const blend = THREE.MathUtils.clamp(
    0.5 + (0.5 * (second - first)) / radius,
    0,
    1,
  );
  return THREE.MathUtils.lerp(second, first, blend)
    - radius * blend * (1 - blend);
}

function roundedCylinderSdf(
  x: number,
  y: number,
  z: number,
  radius: number,
  halfDepth: number,
  cornerRadius: number,
  centerZ: number,
) {
  const radialDistance = Math.hypot(x, y) - (radius - cornerRadius);
  const axialDistance = Math.abs(z - centerZ) - (halfDepth - cornerRadius);
  return Math.min(Math.max(radialDistance, axialDistance), 0)
    + Math.hypot(Math.max(radialDistance, 0), Math.max(axialDistance, 0))
    - cornerRadius;
}

function unifiedShellSdf(x: number, y: number, z: number) {
  const body = revolvedProfileSdf(Math.hypot(x, y), z, BODY_PROFILE);
  const outerFace = ellipsoidSdf(x, y, z - 0.29, 0.91, 0.91, 0.17);
  const blend = revolvedProfileSdf(Math.hypot(x, z), y, BAIL_BLEND_PROFILE);
  const bail = bailTorusSdf(x, y, z);

  let distance = smoothUnion(body, outerFace, 0.035);
  distance = smoothUnion(distance, blend, 0.08);
  distance = smoothUnion(distance, bail, 0.055);

  // Front-opening bore: the rear stop at z=-0.21 leaves a thin plastic back wall.
  const cavity = roundedCylinderSdf(x, y, z, 0.855, 0.465, 0.04, 0.255);
  return Math.max(distance, -cavity);
}

function addPlanarUvs(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute("position");
  const uvs = new Float32Array(positions.count * 2);
  const width = BOUNDS_MAX.x - BOUNDS_MIN.x;
  const height = BOUNDS_MAX.y - BOUNDS_MIN.y;

  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = (positions.getX(index) - BOUNDS_MIN.x) / width;
    uvs[index * 2 + 1] = (positions.getY(index) - BOUNDS_MIN.y) / height;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
}

export function createUnifiedShellGeometry() {
  const placeholderMaterial = new THREE.MeshBasicMaterial();
  const marchingCubes = new MarchingCubes(
    GRID_RESOLUTION,
    placeholderMaterial,
    false,
    false,
    MAX_POLYGON_COUNT,
  );
  marchingCubes.isolation = 0;

  const center = BOUNDS_MIN.clone().add(BOUNDS_MAX).multiplyScalar(0.5);
  const halfExtent = BOUNDS_MAX.clone().sub(BOUNDS_MIN).multiplyScalar(0.5);
  const halfResolution = GRID_RESOLUTION / 2;

  for (let z = 0; z < GRID_RESOLUTION; z += 1) {
    const worldZ = center.z + ((z - halfResolution) / halfResolution) * halfExtent.z;
    for (let y = 0; y < GRID_RESOLUTION; y += 1) {
      const worldY = center.y + ((y - halfResolution) / halfResolution) * halfExtent.y;
      for (let x = 0; x < GRID_RESOLUTION; x += 1) {
        const worldX = center.x + ((x - halfResolution) / halfResolution) * halfExtent.x;
        marchingCubes.setCell(x, y, z, -unifiedShellSdf(worldX, worldY, worldZ));
      }
    }
  }

  marchingCubes.update();
  const activePositions = marchingCubes.positionArray.slice(0, marchingCubes.count * 3);
  const rawGeometry = new THREE.BufferGeometry();
  rawGeometry.setAttribute("position", new THREE.BufferAttribute(activePositions, 3));

  const positions = rawGeometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    positions.setXYZ(
      index,
      center.x + positions.getX(index) * halfExtent.x,
      center.y + positions.getY(index) * halfExtent.y,
      center.z + positions.getZ(index) * halfExtent.z,
    );
  }

  const geometry = mergeVertices(rawGeometry, 0.0005);
  geometry.computeVertexNormals();
  addPlanarUvs(geometry);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  rawGeometry.dispose();
  marchingCubes.geometry.dispose();
  placeholderMaterial.dispose();
  return geometry;
}
