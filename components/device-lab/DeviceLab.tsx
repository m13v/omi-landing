"use client";

import {
  Suspense,
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
  Sparkles,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import DeviceControls from "./DeviceControls";
import { createDefaultLabSettings, type LabSettings } from "./device-settings";
import styles from "./device-lab.module.css";
import { createUnifiedShellGeometry } from "./unified-shell";

const GUNMETAL_CORE_PROFILE = [
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

function createGrainTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function updateGrainTexture(
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

function Cord({
  attachment,
  angularVelocity,
  grainTexture,
  impactImpulse,
  pendulumAngle,
  reduceMotion,
  settings,
}: {
  attachment: MutableRefObject<THREE.Vector2>;
  angularVelocity: MutableRefObject<number>;
  grainTexture: THREE.DataTexture;
  impactImpulse: MutableRefObject<THREE.Vector2>;
  pendulumAngle: MutableRefObject<number>;
  reduceMotion: boolean;
  settings: LabSettings;
}) {
  const rope = useMemo(() => {
    const guide = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-5.1, 7.35, -0.18),
        new THREE.Vector3(-3.55, 5.45, -0.12),
        new THREE.Vector3(-1.82, 2.75, -0.05),
        new THREE.Vector3(-0.58, 1.34, -0.015),
        new THREE.Vector3(0, 0.78, 0),
        new THREE.Vector3(0.58, 1.34, -0.015),
        new THREE.Vector3(1.82, 2.75, -0.05),
        new THREE.Vector3(3.55, 5.45, -0.12),
        new THREE.Vector3(5.1, 7.35, -0.18),
      ],
      false,
      "catmullrom",
      0.42,
    );
    const particleCount = 41;
    const particles = Array.from({ length: particleCount }, (_, index) => (
      guide.getPointAt(index / (particleCount - 1))
    ));
    const previousParticles = particles.map((particle) => particle.clone());
    const restLengths = new Float32Array(particleCount - 1);
    const inverseMasses = new Float32Array(particleCount);

    for (let index = 0; index < particleCount - 1; index += 1) {
      restLengths[index] = particles[index].distanceTo(particles[index + 1]);
    }
    for (let index = 0; index < particleCount; index += 1) {
      const progress = index / (particleCount - 1);
      const pendantLoad = Math.exp(-Math.pow((progress - 0.5) / 0.062, 2));
      inverseMasses[index] = 1 / (1 + pendantLoad * 18);
    }
    inverseMasses[0] = 0;
    inverseMasses[particleCount - 1] = 0;

    const curve = new THREE.CatmullRomCurve3(
      particles,
      false,
      "catmullrom",
      0.46,
    );
    const geometry = new THREE.TubeGeometry(curve, 160, 0.038, 10, false);
    return {
      curve,
      geometry,
      inverseMasses,
      particles,
      previousParticles,
      restLengths,
    };
  }, []);
  const meshUpdateElapsed = useRef(0);

  useFrame((state, delta) => {
    if (reduceMotion) {
      const center = rope.particles[Math.floor(rope.particles.length / 2)];
      attachment.current.set(center.x, center.y);
      return;
    }

    const impact = impactImpulse.current;
    if (impact.lengthSq() > 0.000001) {
      const centerIndex = Math.floor(rope.particles.length / 2);
      for (let offset = -4; offset <= 4; offset += 1) {
        const particleIndex = centerIndex + offset;
        const influence = Math.exp(-Math.pow(offset / 2.15, 2));
        rope.previousParticles[particleIndex].x -= impact.x * influence;
        rope.previousParticles[particleIndex].y -= impact.y * influence;
      }
      impact.set(0, 0);
    }

    let remainingTime = Math.min(delta, 0.05);
    while (remainingTime > 0) {
      const step = Math.min(remainingTime, 1 / 60);
      const stepSquared = step * step;
      const particleCount = rope.particles.length;

      for (let index = 1; index < particleCount - 1; index += 1) {
        const particle = rope.particles[index];
        const previous = rope.previousParticles[index];
        const progress = index / (particleCount - 1);
        const pendantLoad = Math.exp(-Math.pow((progress - 0.5) / 0.062, 2));
        const freeSpan = Math.sin(Math.PI * progress);
        const velocityX = (particle.x - previous.x) * 0.987;
        const velocityY = (particle.y - previous.y) * 0.987;
        const velocityZ = (particle.z - previous.z) * 0.982;
        const currentX = particle.x;
        const currentY = particle.y;
        const currentZ = particle.z;
        const pendantReaction = (
          Math.sin(pendulumAngle.current) * 3.4
          + angularVelocity.current * 0.42
        ) * pendantLoad;
        const airCurrent = Math.sin(
          state.clock.elapsedTime * 0.58 + index * 0.29,
        ) * freeSpan * 0.045;

        particle.set(
          particle.x + velocityX + (pendantReaction + airCurrent) * stepSquared,
          particle.y + velocityY - (1.25 + pendantLoad * 28) * stepSquared,
          particle.z + velocityZ + airCurrent * 0.22 * stepSquared,
        );
        previous.set(currentX, currentY, currentZ);
      }

      for (let iteration = 0; iteration < 12; iteration += 1) {
        for (let index = 0; index < particleCount - 1; index += 1) {
          const first = rope.particles[index];
          const second = rope.particles[index + 1];
          const deltaX = second.x - first.x;
          const deltaY = second.y - first.y;
          const deltaZ = second.z - first.z;
          const distance = Math.hypot(deltaX, deltaY, deltaZ) || 1;
          const error = (distance - rope.restLengths[index]) / distance;
          const firstWeight = rope.inverseMasses[index];
          const secondWeight = rope.inverseMasses[index + 1];
          const weightTotal = firstWeight + secondWeight;
          if (weightTotal === 0) continue;

          const firstCorrection = error * (firstWeight / weightTotal);
          const secondCorrection = error * (secondWeight / weightTotal);
          first.x += deltaX * firstCorrection;
          first.y += deltaY * firstCorrection;
          first.z += deltaZ * firstCorrection;
          second.x -= deltaX * secondCorrection;
          second.y -= deltaY * secondCorrection;
          second.z -= deltaZ * secondCorrection;
        }
      }
      remainingTime -= step;
    }

    const center = rope.particles[Math.floor(rope.particles.length / 2)];
    attachment.current.set(center.x, center.y);
    meshUpdateElapsed.current += delta;
    if (meshUpdateElapsed.current < 1 / 30) return;
    meshUpdateElapsed.current = 0;

    rope.curve.updateArcLengths();
    const updatedGeometry = new THREE.TubeGeometry(
      rope.curve,
      160,
      0.038,
      10,
      false,
    );
    const positions = rope.geometry.getAttribute("position") as THREE.BufferAttribute;
    const normals = rope.geometry.getAttribute("normal") as THREE.BufferAttribute;
    (positions.array as Float32Array).set(
      updatedGeometry.getAttribute("position").array,
    );
    (normals.array as Float32Array).set(
      updatedGeometry.getAttribute("normal").array,
    );
    positions.needsUpdate = true;
    normals.needsUpdate = true;
    updatedGeometry.dispose();
  });

  useEffect(() => () => rope.geometry.dispose(), [rope.geometry]);

  return (
    <mesh geometry={rope.geometry} castShadow>
      <meshStandardMaterial
        color={settings.cord.color}
        roughness={settings.cord.roughness}
        metalness={settings.cord.metalness}
        bumpMap={settings.texture.enabled ? grainTexture : undefined}
        bumpScale={settings.cord.bumpScale}
      />
    </mesh>
  );
}

interface DeviceProps {
  reduceMotion: boolean;
  settings: LabSettings;
  position?: [number, number, number];
  onWakeChange?: (awake: boolean) => void;
}

function Device({
  reduceMotion,
  settings,
  position = [0, -0.16, 0],
  onWakeChange,
}: DeviceProps) {
  const pivot = useRef<THREE.Group>(null);
  const outerGlow = useRef<THREE.MeshBasicMaterial>(null);
  const innerGlow = useRef<THREE.MeshBasicMaterial>(null);
  const ledCore = useRef<THREE.MeshBasicMaterial>(null);
  const ledLight = useRef<THREE.PointLight>(null);
  const isHovered = useRef(false);
  const pendulumAngle = useRef(0);
  const angularVelocity = useRef(0);
  const cordAttachment = useRef(new THREE.Vector2(0, 1.15));
  const cordImpactImpulse = useRef(new THREE.Vector2());
  const glowLevel = useRef(0);
  const grainTexture = useMemo(createGrainTexture, []);
  const shellGrainTexture = useMemo(createGrainTexture, []);
  const shellGeometry = useMemo(createUnifiedShellGeometry, []);
  const outerGlowColor = useMemo(
    () => new THREE.Color(settings.led.outerColor),
    [settings.led.outerColor],
  );
  const innerGlowColor = useMemo(
    () => new THREE.Color(settings.led.innerColor),
    [settings.led.innerColor],
  );
  const ledCoreColor = useMemo(
    () => new THREE.Color(settings.led.coreColor),
    [settings.led.coreColor],
  );

  useEffect(() => {
    updateGrainTexture(grainTexture, settings.texture.repeat, settings.texture.contrast);
  }, [grainTexture, settings.texture.contrast, settings.texture.repeat]);

  useEffect(() => {
    updateGrainTexture(
      shellGrainTexture,
      settings.shell.noiseScale,
      settings.shell.noiseContrast,
      settings.shell.noiseSeed,
    );
  }, [
    settings.shell.noiseContrast,
    settings.shell.noiseScale,
    settings.shell.noiseSeed,
    shellGrainTexture,
  ]);

  useEffect(
    () => () => {
      shellGeometry.dispose();
      grainTexture.dispose();
      shellGrainTexture.dispose();
    },
    [grainTexture, shellGeometry, shellGrainTexture],
  );

  const bumpMap = settings.texture.enabled ? grainTexture : undefined;
  const shellBumpMap = settings.shell.noiseEnabled ? shellGrainTexture : undefined;

  const applyPointerImpact = useCallback((
    event: ThreeEvent<PointerEvent>,
    initialImpact: boolean,
  ) => {
    if (reduceMotion) return;

    const movementX = event.nativeEvent.movementX;
    const movementY = event.nativeEvent.movementY;
    let impactX = THREE.MathUtils.clamp(movementX / 48, -1, 1);
    let impactY = THREE.MathUtils.clamp(-movementY / 48, -1, 1);

    if (Math.hypot(impactX, impactY) < 0.06 && event.uv) {
      impactX = 0.5 - event.uv.x;
      impactY = 0.5 - event.uv.y;
      const fallbackLength = Math.hypot(impactX, impactY) || 1;
      impactX /= fallbackLength;
      impactY /= fallbackLength;
    }

    const angularStrength = initialImpact ? 0.78 : 0.16;
    angularVelocity.current = THREE.MathUtils.clamp(
      angularVelocity.current + impactX * angularStrength,
      -1.45,
      1.45,
    );

    const cordStrength = initialImpact ? 0.052 : 0.012;
    cordImpactImpulse.current.x = THREE.MathUtils.clamp(
      cordImpactImpulse.current.x + impactX * cordStrength,
      -0.11,
      0.11,
    );
    cordImpactImpulse.current.y = THREE.MathUtils.clamp(
      cordImpactImpulse.current.y + impactY * cordStrength,
      -0.11,
      0.11,
    );
  }, [reduceMotion]);

  const wakePendant = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (isHovered.current) return;
    isHovered.current = true;
    applyPointerImpact(event, true);
    onWakeChange?.(true);
    document.documentElement.style.cursor = "pointer";
  }, [applyPointerImpact, onWakeChange]);

  const movePendant = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!isHovered.current) return;
    if (Math.hypot(
      event.nativeEvent.movementX,
      event.nativeEvent.movementY,
    ) < 1.5) return;
    applyPointerImpact(event, false);
  }, [applyPointerImpact]);

  const restPendant = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    isHovered.current = false;
    onWakeChange?.(false);
    document.documentElement.style.cursor = "default";
  }, [onWakeChange]);

  useEffect(() => () => {
    document.documentElement.style.cursor = "default";
  }, []);

  useFrame((state, delta) => {
    if (!pivot.current) return;

    const step = Math.min(delta, 1 / 30);
    if (reduceMotion) {
      pendulumAngle.current = 0;
      angularVelocity.current = 0;
    } else {
      const acceleration = -10.5 * Math.sin(pendulumAngle.current)
        - 2.35 * angularVelocity.current;
      angularVelocity.current += acceleration * step;
      pendulumAngle.current = THREE.MathUtils.clamp(
        pendulumAngle.current + angularVelocity.current * step,
        -0.15,
        0.15,
      );
    }

    const rotationEase = 1 - Math.exp(-delta * 3.5);
    pivot.current.position.x = cordAttachment.current.x;
    pivot.current.position.y = cordAttachment.current.y;
    pivot.current.rotation.z = pendulumAngle.current;
    pivot.current.rotation.y = THREE.MathUtils.lerp(
      pivot.current.rotation.y,
      isHovered.current ? state.pointer.x * 0.055 : 0,
      rotationEase,
    );
    pivot.current.rotation.x = THREE.MathUtils.lerp(
      pivot.current.rotation.x,
      isHovered.current ? -state.pointer.y * 0.018 : 0,
      rotationEase,
    );

    const lightTarget = isHovered.current ? 1 : 0;
    const lightEase = reduceMotion
      ? 1
      : 1 - Math.exp(-delta * (lightTarget > glowLevel.current ? 5.5 : 3.2));
    glowLevel.current = THREE.MathUtils.lerp(
      glowLevel.current,
      lightTarget,
      lightEase,
    );

    if (outerGlow.current) {
      outerGlow.current.opacity = settings.led.outerOpacity * glowLevel.current * 2.8;
      outerGlow.current.color
        .copy(outerGlowColor)
        .multiplyScalar(0.25 + glowLevel.current * 3.2);
    }
    if (innerGlow.current) {
      innerGlow.current.opacity = settings.led.innerOpacity * glowLevel.current * 2.3;
      innerGlow.current.color
        .copy(innerGlowColor)
        .multiplyScalar(0.25 + glowLevel.current * 4.5);
    }
    if (ledCore.current) {
      ledCore.current.color
        .copy(ledCoreColor)
        .multiplyScalar(0.015 + glowLevel.current * 5.5);
    }
    if (ledLight.current) {
      ledLight.current.intensity = settings.led.lightIntensity * glowLevel.current * 4.5;
    }
  });

  return (
    <group position={position}>
      <Cord
        attachment={cordAttachment}
        angularVelocity={angularVelocity}
        grainTexture={grainTexture}
        impactImpulse={cordImpactImpulse}
        pendulumAngle={pendulumAngle}
        reduceMotion={reduceMotion}
        settings={settings}
      />
      <group ref={pivot} position={[0, 1.15, 0]}>
        <group position={[0, -1.15, 0]} rotation={[0.02, -0.08, -0.015]}>
          <mesh
            position={[0, 0, 0.7]}
            onPointerMove={movePendant}
            onPointerOver={wakePendant}
            onPointerOut={restPendant}
          >
            <circleGeometry args={[1.09, 64]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              colorWrite={false}
            />
          </mesh>

          <mesh geometry={shellGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={settings.shell.color}
          transmission={settings.shell.transmission}
          thickness={settings.shell.thickness}
          ior={settings.shell.ior}
          attenuationColor={settings.shell.attenuationColor}
          attenuationDistance={settings.shell.attenuationDistance}
          metalness={settings.shell.metalness}
          roughness={settings.shell.roughness}
          clearcoat={settings.shell.clearcoat}
          clearcoatRoughness={settings.shell.clearcoatRoughness}
          bumpMap={shellBumpMap}
          bumpScale={settings.shell.bumpScale}
          envMapIntensity={settings.shell.envMapIntensity}
        />
          </mesh>

          <mesh position={[0, 0, 0.015]} castShadow>
        <torusGeometry args={[0.995, 0.027, 20, 160]} />
        <meshPhysicalMaterial
          color={settings.seam.color}
          metalness={settings.seam.metalness}
          roughness={settings.seam.roughness}
          clearcoat={settings.seam.clearcoat}
          clearcoatRoughness={settings.seam.clearcoatRoughness}
          bumpMap={bumpMap}
          bumpScale={settings.seam.bumpScale}
          envMapIntensity={settings.seam.envMapIntensity}
        />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <latheGeometry args={[GUNMETAL_CORE_PROFILE, 192]} />
        <meshPhysicalMaterial
          color={settings.core.color}
          metalness={settings.core.metalness}
          roughness={settings.core.roughness}
          clearcoat={settings.core.clearcoat}
          clearcoatRoughness={settings.core.clearcoatRoughness}
          bumpMap={bumpMap}
          bumpScale={settings.core.bumpScale}
          envMapIntensity={settings.core.envMapIntensity}
        />
          </mesh>

          <mesh position={[0, 0, 0.35]} castShadow>
        <torusGeometry args={[0.81, 0.08, 28, 192]} />
        <meshPhysicalMaterial
          color={settings.bezel.color}
          metalness={settings.bezel.metalness}
          roughness={settings.bezel.roughness}
          clearcoat={settings.bezel.clearcoat}
          clearcoatRoughness={settings.bezel.clearcoatRoughness}
          bumpMap={bumpMap}
          bumpScale={settings.bezel.bumpScale}
          envMapIntensity={settings.bezel.envMapIntensity}
        />
          </mesh>

          <group position={[0, 0, 0.56]}>
            <mesh>
          <circleGeometry args={[0.115, 64]} />
          <meshBasicMaterial
            ref={outerGlow}
            color="#000000"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
            </mesh>
            <mesh position={[0, 0, 0.004]}>
          <circleGeometry args={[0.067, 64]} />
          <meshBasicMaterial
            ref={innerGlow}
            color="#000000"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
          <circleGeometry args={[0.031, 64]} />
          <meshBasicMaterial ref={ledCore} color="#000000" toneMapped={false} />
            </mesh>
            <pointLight
          ref={ledLight}
          color={settings.led.lightColor}
          intensity={0}
          distance={1.6}
          decay={2}
        />
          </group>
        </group>
      </group>
    </group>
  );
}

function Atmosphere({ reduceMotion, positionX }: {
  reduceMotion: boolean;
  positionX: number;
}) {
  const drift = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!drift.current || reduceMotion) return;
    drift.current.rotation.y += delta * 0.012;
    drift.current.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
  });

  return (
    <group ref={drift} position={[positionX, 0, -0.8]}>
      <Sparkles
        count={reduceMotion ? 48 : 120}
        scale={[6.8, 4.2, 3.4]}
        size={1.25}
        speed={reduceMotion ? 0 : 0.08}
        opacity={0.2}
        color="#a9bbdf"
        noise={1.2}
      />
      <Sparkles
        count={reduceMotion ? 16 : 34}
        scale={[5.2, 3.4, 2.6]}
        size={3.2}
        speed={reduceMotion ? 0 : 0.035}
        opacity={0.08}
        color="#b188b4"
        noise={0.7}
      />
    </group>
  );
}

function RendererSettings({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);
  return null;
}

function Stage({
  reduceMotion,
  settings,
  onWakeChange,
}: DeviceProps) {
  const { size } = useThree();
  const isNarrow = size.width < 760;
  const pendantX = isNarrow ? 0 : 1.08;
  const pendantY = isNarrow ? -0.62 : -0.14;
  return (
    <>
      <RendererSettings exposure={settings.stage.exposure} />
      <color attach="background" args={[settings.stage.background]} />
      <fog
        attach="fog"
        args={[settings.stage.fogColor, isNarrow ? 16 : 15, isNarrow ? 28 : 26]}
      />
      <PerspectiveCamera
        makeDefault
        position={[0, isNarrow ? 0.18 : 0.08, isNarrow ? 14.2 : 12.6]}
        fov={isNarrow ? 33 : 31}
      />
      <ambientLight color={settings.stage.ambientColor} intensity={settings.stage.ambientIntensity} />
      <hemisphereLight
        args={[
          settings.stage.hemisphereSky,
          settings.stage.hemisphereGround,
          settings.stage.hemisphereIntensity,
        ]}
      />
      <spotLight
        position={[-3.8, 4.5, 5]}
        color={settings.stage.keyColor}
        intensity={settings.stage.keyIntensity}
        angle={0.34}
        penumbra={0.9}
        distance={11}
      />
      <spotLight
        position={[4.5, 1.1, 3.6]}
        color={settings.stage.fillColor}
        intensity={settings.stage.fillIntensity}
        angle={0.28}
        penumbra={1}
        distance={10}
      />
      <pointLight
        position={[-2.6, -1.8, 1.4]}
        color={settings.stage.rimColor}
        intensity={settings.stage.rimIntensity}
        distance={7}
      />

      <Suspense fallback={null}>
        <Atmosphere reduceMotion={reduceMotion} positionX={pendantX} />
        <Device
          reduceMotion={reduceMotion}
          settings={settings}
          position={[pendantX, pendantY, 0]}
          onWakeChange={onWakeChange}
        />
        <Environment resolution={256}>
          <group rotation={[0, 0, Math.PI / 6]}>
            <Lightformer
              form="rect"
              intensity={settings.environment.keyIntensity}
              color={settings.environment.keyColor}
              position={[-3, 3.5, 2]}
              scale={[1.2, 4, 1]}
            />
            <Lightformer
              form="rect"
              intensity={settings.environment.sideIntensity}
              color={settings.environment.sideColor}
              position={[4, 0.4, 1]}
              scale={[1, 3, 1]}
              rotation={[0, -Math.PI / 2, 0]}
            />
            <Lightformer
              form="ring"
              intensity={settings.environment.ringIntensity}
              color={settings.environment.ringColor}
              position={[0, -4, 1]}
              scale={2.5}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        </Environment>
      </Suspense>

      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          intensity={1.55}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.3}
        />
      </EffectComposer>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={isNarrow ? 12 : 10}
        maxDistance={isNarrow ? 18 : 16}
        minPolarAngle={Math.PI * 0.34}
        maxPolarAngle={Math.PI * 0.66}
        minAzimuthAngle={-Math.PI * 0.42}
        maxAzimuthAngle={Math.PI * 0.42}
        target={[isNarrow ? 0 : 0.62, isNarrow ? -0.2 : 0.08, 0]}
        dampingFactor={0.055}
      />
    </>
  );
}

export default function DeviceLab() {
  const reduceMotion = useReducedMotion() ?? false;
  const settings = useMemo(createDefaultLabSettings, []);
  const [, setVersion] = useState(0);
  const [isAwake, setIsAwake] = useState(false);
  const handleSettingsChange = useCallback(() => {
    setVersion((version) => version + 1);
  }, []);

  return (
    <main className={styles.lab}>
      <section className={styles.productSection} aria-labelledby="wearable-heading">
        <div className={styles.halo} aria-hidden="true" />
        <div className={styles.haze} aria-hidden="true" />

        <div className={styles.copy}>
          <p className={styles.productName}>Omi wearable</p>
          <h1 id="wearable-heading" className={styles.heading}>
            Intelligence,
            <span>close to heart.</span>
          </h1>
          <p className={styles.description}>
            A personal AI that listens when invited, remembers what matters,
            and keeps the next step close.
          </p>
          <div
            className={`${styles.wakeCue} ${isAwake ? styles.wakeCueActive : ""}`}
            aria-live="polite"
          >
            <span className={styles.wakeDot} aria-hidden="true" />
            {isAwake ? "Omi is awake" : "Hover over Omi to wake"}
          </div>
        </div>

        <DeviceControls settings={settings} onChange={handleSettingsChange} />
        <Canvas
          className={styles.canvas}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: settings.stage.exposure,
          }}
          aria-label="Interactive Omi pendant. Hover to wake its light and set it gently swinging."
        >
          <Stage
            reduceMotion={reduceMotion}
            settings={settings}
            onWakeChange={setIsAwake}
          />
        </Canvas>

        <div className={styles.identity} aria-hidden="true">
          <span className={styles.mark}>omi</span>
          <span className={styles.divider} />
          <span>personal intelligence</span>
        </div>
        <div className={styles.instructions} aria-hidden="true">
          <span>drag to inspect</span>
          <span>scroll to move closer</span>
        </div>
      </section>
    </main>
  );
}
