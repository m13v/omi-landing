"use client";

import {
  Component,
  Suspense,
  type ErrorInfo,
  type RefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  PerspectiveCamera,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import type { MotionValue } from "framer-motion";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import type { CameraPoseSettings, LabSettings } from "./device-settings";
import { getUnifiedShellGeometry } from "./unified-shell";

import {
  GUNMETAL_CORE_PROFILE,
  PENDANT_DROP,
  PENDANT_SCALE,
  PRODUCT_YAW,
  createGrainTexture,
  updateGrainTexture,
} from "./device-geometry";

type BodyRef = RefObject<RapierRigidBody>;

interface CordBodies {
  leftAnchor: BodyRef;
  leftOne: BodyRef;
  leftTwo: BodyRef;
  leftThree: BodyRef;
  junction: BodyRef;
  rightThree: BodyRef;
  rightTwo: BodyRef;
  rightOne: BodyRef;
  rightAnchor: BodyRef;
}

function CordVisual({ bodies, settings }: {
  bodies: CordBodies;
  settings: LabSettings;
}) {
  const { size } = useThree();
  const geometry = useMemo(() => {
    const line = new MeshLineGeometry();
    line.setPoints([
      new THREE.Vector3(-5, 7, 0),
      new THREE.Vector3(-3.8, 5.4, 0),
      new THREE.Vector3(-2.4, 3.6, 0),
      new THREE.Vector3(-1.1, 1.8, 0),
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(1.1, 1.8, 0),
      new THREE.Vector3(2.4, 3.6, 0),
      new THREE.Vector3(3.8, 5.4, 0),
      new THREE.Vector3(5, 7, 0),
    ]);
    return line;
  }, []);
  const material = useMemo(() => new MeshLineMaterial({
    color: settings.cord.color,
    lineWidth: 0.234,
    resolution: new THREE.Vector2(size.width, size.height),
    sizeAttenuation: 1,
  }), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
    Array.from({ length: 9 }, () => new THREE.Vector3()),
    false,
    "catmullrom",
    0.48,
  ), []);
  const lastPoints = useRef<Float32Array | null>(null);

  useEffect(() => {
    material.color.set(settings.cord.color);
  }, [material, settings.cord.color]);

  useEffect(() => {
    material.resolution.set(size.width, size.height);
  }, [material, size.height, size.width]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(() => {
    const refs = [
      bodies.leftAnchor,
      bodies.leftOne,
      bodies.leftTwo,
      bodies.leftThree,
      bodies.junction,
      bodies.rightThree,
      bodies.rightTwo,
      bodies.rightOne,
      bodies.rightAnchor,
    ];
    if (refs.some((body) => !body.current)) return;

    const firstUpdate = lastPoints.current === null;
    const nextPoints = lastPoints.current ?? new Float32Array(refs.length * 3);
    let changed = firstUpdate;
    refs.forEach((body, index) => {
      const translation = body.current!.translation();
      curve.points[index].set(translation.x, translation.y, translation.z - 0.04);
      const offset = index * 3;
      if (
        firstUpdate
        || Math.abs(nextPoints[offset] - translation.x) > 0.0001
        || Math.abs(nextPoints[offset + 1] - translation.y) > 0.0001
        || Math.abs(nextPoints[offset + 2] - translation.z) > 0.0001
      ) {
        changed = true;
        nextPoints[offset] = translation.x;
        nextPoints[offset + 1] = translation.y;
        nextPoints[offset + 2] = translation.z;
      }
    });
    lastPoints.current = nextPoints;
    if (!changed) return;
    geometry.setPoints(curve.getPoints(24));
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}

export interface DeviceProps {
  reduceMotion: boolean;
  settings: LabSettings;
  position?: [number, number, number];
  onWakeChange?: (awake: boolean) => void;
  onActivate?: () => void;
  physicsRelease?: MotionValue<number>;
  forceAwake?: boolean;
  interactionEnabled?: boolean;
}

export class PhysicsBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn("Physics unavailable; using the static 3D fallback.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export class PostProcessingBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn("Post processing unavailable; continuing with the base 3D render.", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function StaticCord({
  position,
  settings,
}: {
  position: [number, number, number];
  settings: LabSettings;
}) {
  const { size } = useThree();
  const [sceneX, sceneY, sceneZ] = position;
  const geometry = useMemo(() => {
    const localPoints: Array<[number, number]> = [
      [-5.1, 7.35],
      [-3.9, 5.72],
      [-2.5, 3.97],
      [-1.15, 2.32],
      [0, 1.02],
      [1.15, 2.32],
      [2.5, 3.97],
      [3.9, 5.72],
      [5.1, 7.35],
    ];
    const points = localPoints.map(([x, y]) => new THREE.Vector3(
      sceneX + x * Math.cos(PRODUCT_YAW),
      sceneY + y,
      sceneZ - x * Math.sin(PRODUCT_YAW) - 0.04,
    ));
    const curve = new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.48,
    );
    const line = new MeshLineGeometry();
    line.setPoints(curve.getPoints(32));
    return line;
  }, [sceneX, sceneY, sceneZ]);
  const material = useMemo(() => new MeshLineMaterial({
    color: settings.cord.color,
    lineWidth: 0.234,
    resolution: new THREE.Vector2(size.width, size.height),
    sizeAttenuation: 1,
  }), []);

  useEffect(() => {
    material.color.set(settings.cord.color);
  }, [material, settings.cord.color]);

  useEffect(() => {
    material.resolution.set(size.width, size.height);
  }, [material, size.height, size.width]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}

export function StaticPendantFallback({
  reduceMotion,
  settings,
  position = [0, -0.16, 0],
  onWakeChange,
  onActivate,
  forceAwake,
  interactionEnabled,
}: DeviceProps) {
  return (
    <>
      <StaticCord position={position} settings={settings} />
      <group position={[
        position[0],
        position[1] + 1.02 - PENDANT_DROP,
        position[2],
      ]}>
        <PendantVisual
          reduceMotion={reduceMotion}
          settings={settings}
          onWakeChange={onWakeChange}
          onActivate={onActivate}
          forceAwake={forceAwake}
          interactionEnabled={interactionEnabled}
        />
      </group>
    </>
  );
}

function PendantVisual({
  body,
  reduceMotion,
  settings,
  onWakeChange,
  onActivate,
  physicsRelease,
  forceAwake = false,
  interactionEnabled = true,
}: Omit<DeviceProps, "position"> & { body?: BodyRef }) {
  const outerGlow = useRef<THREE.MeshBasicMaterial>(null);
  const innerGlow = useRef<THREE.MeshBasicMaterial>(null);
  const ledCore = useRef<THREE.MeshBasicMaterial>(null);
  const ledLight = useRef<THREE.PointLight>(null);
  const isHovered = useRef(false);
  const glowLevel = useRef(forceAwake ? 1 : 0);
  const grainTexture = useMemo(createGrainTexture, []);
  const shellGrainTexture = useMemo(createGrainTexture, []);
  const shellGeometry = useMemo(() => getUnifiedShellGeometry(52), []);
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
      grainTexture.dispose();
      shellGrainTexture.dispose();
    },
    [grainTexture, shellGrainTexture],
  );

  const bumpMap = settings.texture.enabled ? grainTexture : undefined;
  const shellBumpMap = settings.shell.noiseEnabled ? shellGrainTexture : undefined;

  const applyPointerImpact = useCallback((
    event: ThreeEvent<PointerEvent>,
    initialImpact: boolean,
  ) => {
    if (reduceMotion) return;

    const releaseAmount = physicsRelease?.get() ?? 0;
    if (releaseAmount < 0.78) return;

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

    const rigidBody = body?.current;
    if (!rigidBody) return;

    if (Math.hypot(impactX, impactY) < 0.06) {
      const center = rigidBody.translation();
      impactX = center.x - event.point.x;
      impactY = center.y - event.point.y;
      const fallbackLength = Math.hypot(impactX, impactY) || 1;
      impactX /= fallbackLength;
      impactY /= fallbackLength;
    }

    const interactionEase = THREE.MathUtils.smoothstep(releaseAmount, 0.78, 1);
    const strength = (initialImpact ? 4.2 : 0.9) * interactionEase;
    rigidBody.applyImpulseAtPoint(
      { x: impactX * strength, y: impactY * strength, z: 0 },
      { x: event.point.x, y: event.point.y, z: event.point.z },
      true,
    );
  }, [body, physicsRelease, reduceMotion]);

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

  const activatePendant = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onActivate?.();
  }, [onActivate]);

  useEffect(() => () => {
    document.documentElement.style.cursor = "default";
    onWakeChange?.(false);
  }, [onWakeChange]);

  useEffect(() => {
    if (interactionEnabled) return;
    isHovered.current = false;
    document.documentElement.style.cursor = "default";
    onWakeChange?.(false);
  }, [interactionEnabled, onWakeChange]);

  useFrame((_state, delta) => {
    const lightTarget = forceAwake || isHovered.current ? 1 : 0;
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
    <group
      rotation={[0.02, PRODUCT_YAW, -0.015]}
      scale={PENDANT_SCALE}
    >
          {interactionEnabled && (
            <mesh
              position={[0, 0, 0.7]}
              onPointerMove={movePendant}
              onPointerOver={wakePendant}
              onPointerOut={restPendant}
              onClick={activatePendant}
            >
              <circleGeometry args={[1.09, 24]} />
              <meshBasicMaterial
                transparent
                opacity={0}
                depthWrite={false}
                colorWrite={false}
              />
            </mesh>
          )}

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
        <torusGeometry args={[0.995, 0.027, 10, 48]} />
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
        <latheGeometry args={[GUNMETAL_CORE_PROFILE, 48]} />
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
        <torusGeometry args={[0.81, 0.08, 12, 48]} />
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
          <circleGeometry args={[0.115, 24]} />
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
          <circleGeometry args={[0.067, 24]} />
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
          <circleGeometry args={[0.031, 20]} />
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
  );
}

export function PendantRig({
  reduceMotion,
  settings,
  position = [0, -0.16, 0],
  onWakeChange,
  onActivate,
  physicsRelease,
}: DeviceProps) {
  const [sceneX, sceneY, sceneZ] = position;
  const orientedPosition = useCallback((x: number, y: number) => (
    [
      sceneX + x * Math.cos(PRODUCT_YAW),
      sceneY + y,
      sceneZ - x * Math.sin(PRODUCT_YAW),
    ] as [number, number, number]
  ), [sceneX, sceneY, sceneZ]);
  const leftAnchor = useRef<RapierRigidBody>(null) as BodyRef;
  const leftOne = useRef<RapierRigidBody>(null) as BodyRef;
  const leftTwo = useRef<RapierRigidBody>(null) as BodyRef;
  const leftThree = useRef<RapierRigidBody>(null) as BodyRef;
  const junction = useRef<RapierRigidBody>(null) as BodyRef;
  const rightThree = useRef<RapierRigidBody>(null) as BodyRef;
  const rightTwo = useRef<RapierRigidBody>(null) as BodyRef;
  const rightOne = useRef<RapierRigidBody>(null) as BodyRef;
  const rightAnchor = useRef<RapierRigidBody>(null) as BodyRef;
  const pendant = useRef<RapierRigidBody>(null) as BodyRef;
  const lastRelease = useRef<number | null>(null);

  useRopeJoint(leftAnchor, leftOne, [[0, 0, 0], [0, 0, 0], 2.02]);
  useRopeJoint(leftOne, leftTwo, [[0, 0, 0], [0, 0, 0], 2.24]);
  useRopeJoint(leftTwo, leftThree, [[0, 0, 0], [0, 0, 0], 2.14]);
  useRopeJoint(leftThree, junction, [[0, 0, 0], [0, 0, 0], 1.74]);
  useRopeJoint(rightAnchor, rightOne, [[0, 0, 0], [0, 0, 0], 2.02]);
  useRopeJoint(rightOne, rightTwo, [[0, 0, 0], [0, 0, 0], 2.24]);
  useRopeJoint(rightTwo, rightThree, [[0, 0, 0], [0, 0, 0], 2.14]);
  useRopeJoint(rightThree, junction, [[0, 0, 0], [0, 0, 0], 1.74]);
  useSphericalJoint(junction, pendant, [[0, 0, 0], [0, PENDANT_DROP, 0]]);

  const releaseBodies = [
    { body: leftOne, x: -3.9, y: 5.72, linearDamping: 3.2, angularDamping: 3.2 },
    { body: leftTwo, x: -2.5, y: 3.97, linearDamping: 3.2, angularDamping: 3.2 },
    { body: leftThree, x: -1.15, y: 2.32, linearDamping: 3.2, angularDamping: 3.2 },
    { body: junction, x: 0, y: 1.02, linearDamping: 3.2, angularDamping: 3.2 },
    { body: rightThree, x: 1.15, y: 2.32, linearDamping: 3.2, angularDamping: 3.2 },
    { body: rightTwo, x: 2.5, y: 3.97, linearDamping: 3.2, angularDamping: 3.2 },
    { body: rightOne, x: 3.9, y: 5.72, linearDamping: 3.2, angularDamping: 3.2 },
    {
      body: pendant,
      x: 0,
      y: 1.02 - PENDANT_DROP,
      linearDamping: 1.85,
      angularDamping: 2.4,
    },
  ];

  useFrame(() => {
    const rawRelease = THREE.MathUtils.clamp(physicsRelease?.get() ?? 1, 0, 1);
    if (releaseBodies.some(({ body }) => !body.current)) return;
    if (
      lastRelease.current !== null
      && Math.abs(lastRelease.current - rawRelease) < 0.001
    ) return;
    lastRelease.current = rawRelease;
    const easedRelease = rawRelease * rawRelease * (3 - 2 * rawRelease);
    const locked = rawRelease <= 0.001;

    releaseBodies.forEach(({ body, x, y, linearDamping, angularDamping }) => {
      const rigidBody = body.current;
      if (!rigidBody) return;

      rigidBody.setGravityScale(easedRelease, easedRelease > 0.001);
      rigidBody.setLinearDamping(THREE.MathUtils.lerp(14, linearDamping, easedRelease));
      rigidBody.setAngularDamping(THREE.MathUtils.lerp(14, angularDamping, easedRelease));

      if (locked) {
        const [resetX, resetY, resetZ] = orientedPosition(x, y);
        rigidBody.setTranslation({ x: resetX, y: resetY, z: resetZ }, false);
        rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
        rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, false);
        rigidBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, false);
      }
    });
  });

  const dynamicCordProps = {
    colliders: false as const,
    canSleep: true,
    gravityScale: 0,
    linearDamping: 3.2,
    angularDamping: 3.2,
    enabledTranslations: [true, true, false] as [boolean, boolean, boolean],
    enabledRotations: [false, false, false] as [boolean, boolean, boolean],
  };
  const cordBodies: CordBodies = {
    leftAnchor,
    leftOne,
    leftTwo,
    leftThree,
    junction,
    rightThree,
    rightTwo,
    rightOne,
    rightAnchor,
  };

  return (
    <>
      <CordVisual bodies={cordBodies} settings={settings} />

      <RigidBody
        ref={leftAnchor}
        type="fixed"
        colliders={false}
        position={orientedPosition(-5.1, 7.35)}
      >
        <BallCollider args={[0.04]} collisionGroups={0} />
      </RigidBody>
      <RigidBody
        ref={leftOne}
        {...dynamicCordProps}
        position={orientedPosition(-3.9, 5.72)}
      >
        <BallCollider args={[0.055]} mass={0.45} collisionGroups={0} />
      </RigidBody>
      <RigidBody
        ref={leftTwo}
        {...dynamicCordProps}
        position={orientedPosition(-2.5, 3.97)}
      >
        <BallCollider args={[0.055]} mass={0.45} collisionGroups={0} />
      </RigidBody>
      <RigidBody
        ref={leftThree}
        {...dynamicCordProps}
        position={orientedPosition(-1.15, 2.32)}
      >
        <BallCollider args={[0.055]} mass={0.45} collisionGroups={0} />
      </RigidBody>

      <RigidBody
        ref={junction}
        {...dynamicCordProps}
        position={orientedPosition(0, 1.02)}
      >
        <BallCollider args={[0.065]} mass={0.55} collisionGroups={0} />
      </RigidBody>

      <RigidBody
        ref={rightThree}
        {...dynamicCordProps}
        position={orientedPosition(1.15, 2.32)}
      >
        <BallCollider args={[0.055]} mass={0.45} collisionGroups={0} />
      </RigidBody>
      <RigidBody
        ref={rightTwo}
        {...dynamicCordProps}
        position={orientedPosition(2.5, 3.97)}
      >
        <BallCollider args={[0.055]} mass={0.45} collisionGroups={0} />
      </RigidBody>
      <RigidBody
        ref={rightOne}
        {...dynamicCordProps}
        position={orientedPosition(3.9, 5.72)}
      >
        <BallCollider args={[0.055]} mass={0.45} collisionGroups={0} />
      </RigidBody>
      <RigidBody
        ref={rightAnchor}
        type="fixed"
        colliders={false}
        position={orientedPosition(5.1, 7.35)}
      >
        <BallCollider args={[0.04]} collisionGroups={0} />
      </RigidBody>

      <RigidBody
        ref={pendant}
        colliders={false}
        canSleep
        gravityScale={0}
        linearDamping={1.85}
        angularDamping={2.4}
        enabledTranslations={[true, true, false]}
        enabledRotations={[false, false, true]}
        position={orientedPosition(0, 1.02 - PENDANT_DROP)}
      >
        <CuboidCollider
          args={[
            0.92 * PENDANT_SCALE,
            1.05 * PENDANT_SCALE,
            0.28 * PENDANT_SCALE,
          ]}
          mass={5}
          collisionGroups={0}
        />
        <PendantVisual
          body={pendant}
          reduceMotion={reduceMotion}
          settings={settings}
          onWakeChange={onWakeChange}
          onActivate={onActivate}
          physicsRelease={physicsRelease}
        />
      </RigidBody>
    </>
  );
}
