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
  PRODUCT_YAW,
  createGrainTexture,
  updateGrainTexture,
} from "./device-geometry";
import {
  type DeviceProps,
  PendantRig,
  PhysicsBoundary,
  PostProcessingBoundary,
  StaticPendantFallback,
} from "./PendantScene";

function ArchitecturalBlocks({
  pendantX,
  platformTop,
  backdropTop,
  sideTop,
  settings,
}: {
  pendantX: number;
  platformTop: number;
  backdropTop: number;
  sideTop: number;
  settings: LabSettings;
}) {
  const platformHeight = 9;
  const backdropHeight = 10.5;
  const sideHeight = 9.5;
  const grainTexture = useMemo(createGrainTexture, []);

  useEffect(() => {
    updateGrainTexture(
      grainTexture,
      settings.architecture.textureRepeat,
      settings.architecture.textureContrast,
      settings.architecture.textureSeed,
    );
  }, [
    grainTexture,
    settings.architecture.textureContrast,
    settings.architecture.textureRepeat,
    settings.architecture.textureSeed,
  ]);

  useEffect(() => () => grainTexture.dispose(), [grainTexture]);

  const bumpMap = settings.architecture.textureEnabled
    ? grainTexture
    : undefined;
  const platform = settings.architecture.platform;
  const backdrop = settings.architecture.backdrop;
  const cornerBlockRotation: [number, number, number] = [0.18, -0.35, -0.25];
  const frame4Anchor = new THREE.PerspectiveCamera();
  frame4Anchor.position.set(
    settings.camera.frame4.position.x,
    settings.camera.frame4.position.y,
    settings.camera.frame4.position.z,
  );
  frame4Anchor.lookAt(
    settings.camera.frame4.target.x,
    settings.camera.frame4.target.y,
    settings.camera.frame4.target.z,
  );
  frame4Anchor.updateMatrixWorld();

  return (
    <>
      <RoundedBox
        args={[3.8, platformHeight, 2.15]}
        radius={0.06}
        smoothness={3}
        position={[
          pendantX,
          platformTop - platformHeight / 2,
          -0.42,
        ]}
        rotation={[0, PRODUCT_YAW, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={platform.color}
          metalness={platform.metalness}
          roughness={platform.roughness}
          clearcoat={platform.clearcoat}
          clearcoatRoughness={platform.clearcoatRoughness}
          bumpMap={bumpMap}
          bumpScale={platform.bumpScale}
          envMapIntensity={platform.envMapIntensity}
          ior={1.05}
          specularIntensity={0.12}
        />
      </RoundedBox>

      <RoundedBox
        args={[4.6, backdropHeight, 1.35]}
        radius={0.075}
        smoothness={3}
        position={[
          pendantX + 1.1,
          backdropTop - backdropHeight / 2,
          -2.5,
        ]}
        rotation={[0, PRODUCT_YAW, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={backdrop.color}
          metalness={backdrop.metalness}
          roughness={backdrop.roughness}
          clearcoat={backdrop.clearcoat}
          clearcoatRoughness={backdrop.clearcoatRoughness}
          bumpMap={bumpMap}
          bumpScale={backdrop.bumpScale}
          envMapIntensity={backdrop.envMapIntensity}
          ior={1.02}
          specularIntensity={0.08}
        />
      </RoundedBox>

      <RoundedBox
        args={[2.7, sideHeight, 1.45]}
        radius={0.06}
        smoothness={3}
        position={[
          pendantX + 3.25,
          sideTop - sideHeight / 2,
          -1.48,
        ]}
        rotation={[0, PRODUCT_YAW, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={platform.color}
          metalness={platform.metalness}
          roughness={platform.roughness}
          clearcoat={platform.clearcoat}
          clearcoatRoughness={platform.clearcoatRoughness}
          bumpMap={bumpMap}
          bumpScale={platform.bumpScale}
          envMapIntensity={platform.envMapIntensity}
          ior={1.05}
          specularIntensity={0.12}
        />
      </RoundedBox>

      <group
        position={frame4Anchor.position.toArray()}
        quaternion={frame4Anchor.quaternion}
      >
        <pointLight
          position={[-2.4, -2.2, -7]}
          color={settings.stage.fillColor}
          intensity={35}
          distance={9}
          decay={2}
        />
        <RoundedBox
          args={[3.8, platformHeight, 2.15]}
          radius={0.06}
          smoothness={3}
          position={[-4.65, -5.8, -12.2]}
          rotation={cornerBlockRotation}
        >
          <meshPhysicalMaterial
            color={platform.color}
            metalness={platform.metalness}
            roughness={platform.roughness}
            clearcoat={platform.clearcoat}
            clearcoatRoughness={platform.clearcoatRoughness}
            bumpMap={bumpMap}
            bumpScale={platform.bumpScale}
            envMapIntensity={platform.envMapIntensity}
            ior={1.05}
            specularIntensity={0.12}
          />
        </RoundedBox>

        <RoundedBox
          args={[2.7, sideHeight, 1.45]}
          radius={0.06}
          smoothness={3}
          position={[-0.9, -6.4, -10.6]}
          rotation={cornerBlockRotation}
        >
          <meshPhysicalMaterial
            color={platform.color}
            metalness={platform.metalness}
            roughness={platform.roughness}
            clearcoat={platform.clearcoat}
            clearcoatRoughness={platform.clearcoatRoughness}
            bumpMap={bumpMap}
            bumpScale={platform.bumpScale}
            envMapIntensity={platform.envMapIntensity}
            ior={1.05}
            specularIntensity={0.12}
          />
        </RoundedBox>
      </group>
    </>
  );
}

function Atmosphere({ mobileOptimized, reduceMotion, positionX, settings }: {
  mobileOptimized: boolean;
  reduceMotion: boolean;
  positionX: number;
  settings: LabSettings;
}) {
  const drift = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!drift.current || reduceMotion) return;
    drift.current.rotation.y += delta * 0.012;
    drift.current.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
  });

  if (!settings.particles.enabled) return null;

  const dust = settings.particles.dust;
  const glow = settings.particles.glow;

  return (
    <group ref={drift} position={[positionX, 0, -0.8]}>
      <Sparkles
        key={`dust-${dust.count}`}
        count={reduceMotion
          ? Math.max(1, Math.round(dust.count * 0.4))
          : mobileOptimized
            ? Math.max(1, Math.round(dust.count * 0.55))
            : dust.count}
        scale={[dust.spreadX, dust.spreadY, dust.spreadZ]}
        size={dust.size}
        speed={reduceMotion ? 0 : dust.speed}
        opacity={dust.opacity}
        color={dust.color}
        noise={dust.noise}
      />
      <Sparkles
        key={`glow-${glow.count}`}
        count={reduceMotion
          ? Math.max(1, Math.round(glow.count * 0.4))
          : mobileOptimized
            ? Math.max(1, Math.round(glow.count * 0.55))
            : glow.count}
        scale={[glow.spreadX, glow.spreadY, glow.spreadZ]}
        size={glow.size}
        speed={reduceMotion ? 0 : glow.speed}
        opacity={glow.opacity}
        color={glow.color}
        noise={glow.noise}
      />
    </group>
  );
}

const CONVEYOR_ITEM_COUNT = 10;
const CONVEYOR_SPAN = 19;
const CONVEYOR_ANGLE = -0.22;

function PendantConveyor({
  reduceMotion,
  settings,
  progress,
}: {
  reduceMotion: boolean;
  settings: LabSettings;
  progress: MotionValue<number>;
}) {
  const conveyor = useRef<THREE.Group>(null);
  const shellInstances = useRef<THREE.InstancedMesh>(null);
  const seamInstances = useRef<THREE.InstancedMesh>(null);
  const coreInstances = useRef<THREE.InstancedMesh>(null);
  const bezelInstances = useRef<THREE.InstancedMesh>(null);
  const ledInstances = useRef<THREE.InstancedMesh>(null);
  // The cavity lip and bail blend are too thin for the 34-cell preview mesh;
  // keep the conveyor shell at the last artifact-free resolution.
  const shellGeometry = useMemo(() => getUnifiedShellGeometry(44), []);
  const seamGeometry = useMemo(
    () => new THREE.TorusGeometry(0.995, 0.027, 8, 32),
    [],
  );
  const coreGeometry = useMemo(
    () => new THREE.LatheGeometry(GUNMETAL_CORE_PROFILE, 32),
    [],
  );
  const bezelGeometry = useMemo(
    () => new THREE.TorusGeometry(0.81, 0.08, 10, 32),
    [],
  );
  const ledGeometry = useMemo(
    () => new THREE.SphereGeometry(0.036, 8, 6),
    [],
  );
  const item = useMemo(() => new THREE.Object3D(), []);
  const partMatrix = useMemo(() => new THREE.Matrix4(), []);
  const seamMatrix = useMemo(
    () => new THREE.Matrix4().makeTranslation(0, 0, 0.015),
    [],
  );
  const coreMatrix = useMemo(
    () => new THREE.Matrix4().makeRotationX(Math.PI / 2),
    [],
  );
  const bezelMatrix = useMemo(
    () => new THREE.Matrix4().makeTranslation(0, 0, 0.35),
    [],
  );
  const ledMatrix = useMemo(
    () => new THREE.Matrix4().makeTranslation(0, 0, 0.57),
    [],
  );

  useEffect(() => () => {
    seamGeometry.dispose();
    coreGeometry.dispose();
    bezelGeometry.dispose();
    ledGeometry.dispose();
  }, [bezelGeometry, coreGeometry, ledGeometry, seamGeometry]);

  useFrame((state) => {
    const visible = progress.get() >= 0.43;
    if (conveyor.current) conveyor.current.visible = visible;
    if (!visible) return;
    if (
      !shellInstances.current
      || !seamInstances.current
      || !coreInstances.current
      || !bezelInstances.current
      || !ledInstances.current
    ) return;

    const movingOffset = reduceMotion ? 0 : state.clock.elapsedTime * 0.34;
    const cosine = Math.cos(CONVEYOR_ANGLE);
    const sine = Math.sin(CONVEYOR_ANGLE);

    for (let index = 0; index < CONVEYOR_ITEM_COUNT; index += 1) {
      const initial = (index / CONVEYOR_ITEM_COUNT) * CONVEYOR_SPAN;
      const wrapped = THREE.MathUtils.euclideanModulo(
        initial + movingOffset,
        CONVEYOR_SPAN,
      ) - CONVEYOR_SPAN / 2;
      item.position.set(
        wrapped * cosine,
        wrapped * sine,
        0.38 + Math.sin(index * 1.7) * 0.025,
      );
      item.rotation.set(0.05, -0.17, CONVEYOR_ANGLE);
      item.scale.setScalar(0.84);
      item.updateMatrix();

      shellInstances.current.setMatrixAt(index, item.matrix);
      partMatrix.multiplyMatrices(item.matrix, seamMatrix);
      seamInstances.current.setMatrixAt(index, partMatrix);
      partMatrix.multiplyMatrices(item.matrix, coreMatrix);
      coreInstances.current.setMatrixAt(index, partMatrix);
      partMatrix.multiplyMatrices(item.matrix, bezelMatrix);
      bezelInstances.current.setMatrixAt(index, partMatrix);
      partMatrix.multiplyMatrices(item.matrix, ledMatrix);
      ledInstances.current.setMatrixAt(index, partMatrix);
    }

    shellInstances.current.instanceMatrix.needsUpdate = true;
    seamInstances.current.instanceMatrix.needsUpdate = true;
    coreInstances.current.instanceMatrix.needsUpdate = true;
    bezelInstances.current.instanceMatrix.needsUpdate = true;
    ledInstances.current.instanceMatrix.needsUpdate = true;

  });

  return (
    <group
      ref={conveyor}
      position={[
        settings.conveyor.position.x,
        settings.conveyor.position.y,
        settings.conveyor.position.z,
      ]}
      rotation={[
        THREE.MathUtils.degToRad(settings.conveyor.rotation.x),
        THREE.MathUtils.degToRad(settings.conveyor.rotation.y),
        THREE.MathUtils.degToRad(settings.conveyor.rotation.z),
      ]}
    >
      <RoundedBox
        args={[CONVEYOR_SPAN + 1.5, 2.5, 0.42]}
        radius={0.18}
        smoothness={3}
        position={[0, 0, -0.18]}
        rotation={[0, 0, CONVEYOR_ANGLE]}
      >
        <meshPhysicalMaterial
          color="#0c0f14"
          metalness={0.14}
          roughness={0.62}
          clearcoat={0.16}
          clearcoatRoughness={0.7}
          envMapIntensity={0.45}
          transparent
          opacity={0.96}
        />
      </RoundedBox>

      {[-1.17, 1.17].map((offset) => (
        <mesh
          key={offset}
          position={[
            -offset * Math.sin(CONVEYOR_ANGLE),
            offset * Math.cos(CONVEYOR_ANGLE),
            0.09,
          ]}
          rotation={[0, 0, CONVEYOR_ANGLE]}
        >
          <boxGeometry args={[CONVEYOR_SPAN + 1.3, 0.045, 0.08]} />
          <meshStandardMaterial
            color="#566071"
            metalness={0.72}
            roughness={0.34}
            transparent
            opacity={0.72}
          />
        </mesh>
      ))}

      <instancedMesh
        ref={shellInstances}
        args={[shellGeometry, undefined, CONVEYOR_ITEM_COUNT]}
      >
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
          envMapIntensity={settings.shell.envMapIntensity}
          transparent
          opacity={1}
        />
      </instancedMesh>
      <instancedMesh
        ref={seamInstances}
        args={[seamGeometry, undefined, CONVEYOR_ITEM_COUNT]}
      >
        <meshPhysicalMaterial
          color={settings.seam.color}
          metalness={settings.seam.metalness}
          roughness={settings.seam.roughness}
          clearcoat={settings.seam.clearcoat}
          clearcoatRoughness={settings.seam.clearcoatRoughness}
          envMapIntensity={settings.seam.envMapIntensity}
          transparent
          opacity={1}
        />
      </instancedMesh>
      <instancedMesh
        ref={coreInstances}
        args={[coreGeometry, undefined, CONVEYOR_ITEM_COUNT]}
      >
        <meshPhysicalMaterial
          color={settings.core.color}
          metalness={settings.core.metalness}
          roughness={settings.core.roughness}
          clearcoat={settings.core.clearcoat}
          clearcoatRoughness={settings.core.clearcoatRoughness}
          envMapIntensity={settings.core.envMapIntensity}
          transparent
          opacity={1}
        />
      </instancedMesh>
      <instancedMesh
        ref={bezelInstances}
        args={[bezelGeometry, undefined, CONVEYOR_ITEM_COUNT]}
      >
        <meshPhysicalMaterial
          color={settings.bezel.color}
          metalness={settings.bezel.metalness}
          roughness={settings.bezel.roughness}
          clearcoat={settings.bezel.clearcoat}
          clearcoatRoughness={settings.bezel.clearcoatRoughness}
          envMapIntensity={settings.bezel.envMapIntensity}
          transparent
          opacity={1}
        />
      </instancedMesh>
      <instancedMesh
        ref={ledInstances}
        args={[ledGeometry, undefined, CONVEYOR_ITEM_COUNT]}
      >
        <meshBasicMaterial
          color={settings.led.coreColor}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </instancedMesh>
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

interface ScrollCameraProps {
  cameraSettings: LabSettings["camera"];
  isNarrow: boolean;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}

function smootherStep(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function ScrollCamera({
  cameraSettings,
  isNarrow,
  progress,
  reduceMotion,
}: ScrollCameraProps) {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const frames = useMemo(() => {
    const makeFrame = (pose: CameraPoseSettings) => ({
      position: new THREE.Vector3(
        pose.position.x,
        pose.position.y,
        pose.position.z,
      ),
      target: new THREE.Vector3(
        pose.target.x,
        pose.target.y,
        pose.target.z,
      ),
      fov: pose.fov,
    });
    const nextFrames = [
      makeFrame(cameraSettings.frame1),
      makeFrame(cameraSettings.frame2),
      makeFrame(cameraSettings.frame3),
      makeFrame(cameraSettings.frame4),
    ];

    if (isNarrow) {
      nextFrames[0].position.add(new THREE.Vector3(-3.2, 0.07, 4.4));
      nextFrames[0].target.add(new THREE.Vector3(-3.2, -0.27, 0));
      nextFrames[1].position.add(new THREE.Vector3(0, 0.1, 1));
      nextFrames[1].target.add(new THREE.Vector3(-0.7, -0.26, 0));
      nextFrames[2].position.add(new THREE.Vector3(0, 0.1, 1));
      nextFrames[2].target.add(new THREE.Vector3(-0.7, -0.26, 0));
      nextFrames[3].position.add(new THREE.Vector3(0, 0.1, 1));
      nextFrames[3].target.add(new THREE.Vector3(-0.7, -0.26, 0));
      nextFrames.forEach((frame) => {
        frame.fov += 2;
      });
    }

    return nextFrames;
  }, [cameraSettings, isNarrow]);

  useLayoutEffect(() => {
    if (!camera.current) return;
    camera.current.position.copy(frames[0].position);
    camera.current.lookAt(frames[0].target);
    camera.current.updateMatrixWorld();
  }, [frames]);

  useFrame(() => {
    if (!camera.current) return;

    const scroll = THREE.MathUtils.clamp(progress.get(), 0, 1);
    const scaledProgress = scroll * (frames.length - 1);
    const segmentIndex = Math.min(
      frames.length - 2,
      Math.floor(scaledProgress),
    );
    const segmentProgress = scaledProgress - segmentIndex;
    const easedProgress = reduceMotion
      ? (segmentProgress < 0.5 ? 0 : 1)
      : smootherStep(segmentProgress);
    const currentFrame = frames[segmentIndex];
    const nextFrame = frames[segmentIndex + 1];

    camera.current.position.lerpVectors(
      currentFrame.position,
      nextFrame.position,
      easedProgress,
    );
    target.lerpVectors(
      currentFrame.target,
      nextFrame.target,
      easedProgress,
    );
    camera.current.lookAt(target);
    camera.current.fov = THREE.MathUtils.lerp(
      currentFrame.fov,
      nextFrame.fov,
      easedProgress,
    );
    camera.current.updateProjectionMatrix();
    camera.current.updateMatrixWorld();
  });

  return (
    <PerspectiveCamera
      ref={camera}
      makeDefault
      position={frames[0].position.toArray()}
      fov={frames[0].fov}
    />
  );
}

function WorldConveyor({
  reduceMotion,
  settings,
  progress,
}: {
  reduceMotion: boolean;
  settings: LabSettings;
  progress: MotionValue<number>;
}) {
  const frame = settings.camera.frame3;
  const anchorCamera = useMemo(() => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(frame.position.x, frame.position.y, frame.position.z);
    camera.lookAt(frame.target.x, frame.target.y, frame.target.z);
    camera.updateMatrixWorld();
    return camera;
  }, [frame]);

  return (
    <group
      position={anchorCamera.position.toArray()}
      quaternion={anchorCamera.quaternion}
    >
      <PendantConveyor
        reduceMotion={reduceMotion}
        settings={settings}
        progress={progress}
      />
    </group>
  );
}

function CinematicEffects({
  activeFrame,
  mobileOptimized,
  settings,
}: {
  activeFrame: number;
  mobileOptimized: boolean;
  settings: LabSettings;
}) {
  const post = settings.postProcessing;
  const chromaticOffset = useMemo(
    () => new THREE.Vector2(
      post.chromaticAberration.offsetX,
      post.chromaticAberration.offsetY,
    ),
    [
      post.chromaticAberration.offsetX,
      post.chromaticAberration.offsetY,
    ],
  );

  if (!post.enabled) return null;

  return (
    <PostProcessingBoundary>
      <EffectComposer
        multisampling={0}
        frameBufferType={THREE.UnsignedByteType}
        depthBuffer
        stencilBuffer={false}
        enableNormalPass={false}
      >
        <>
          {!mobileOptimized && post.depthOfField.enabled && activeFrame >= 2 && (
            <DepthOfField
              worldFocusDistance={post.depthOfField.focusDistance}
              worldFocusRange={post.depthOfField.focusRange}
              focalLength={post.depthOfField.focalLength}
              bokehScale={post.depthOfField.bokehScale}
              resolutionScale={Math.min(post.depthOfField.resolutionScale, 0.36)}
            />
          )}
          {post.bloom.enabled && (
            <Bloom
              mipmapBlur
              levels={mobileOptimized ? 3 : 4}
              intensity={post.bloom.intensity}
              luminanceThreshold={post.bloom.threshold}
              luminanceSmoothing={post.bloom.smoothing}
              radius={post.bloom.radius}
            />
          )}
          {post.colorGrade.enabled && (
            <>
              <BrightnessContrast
                brightness={post.colorGrade.brightness}
                contrast={post.colorGrade.contrast}
              />
              <HueSaturation
                hue={post.colorGrade.hue}
                saturation={post.colorGrade.saturation}
              />
            </>
          )}
          {!mobileOptimized && post.chromaticAberration.enabled && (
            <ChromaticAberration
              offset={chromaticOffset}
              radialModulation={post.chromaticAberration.radialModulation}
              modulationOffset={post.chromaticAberration.modulationOffset}
            />
          )}
          {post.grain.enabled && (
            <Noise
              opacity={post.grain.opacity}
              premultiply={post.grain.premultiply}
            />
          )}
          {post.vignette.enabled && (
            <Vignette
              eskil={false}
              offset={post.vignette.offset}
              darkness={post.vignette.darkness}
            />
          )}
        </>
      </EffectComposer>
    </PostProcessingBoundary>
  );
}

export default function DeviceStage({
  reduceMotion,
  mobileOptimized,
  settings,
  onWakeChange,
  onActivate,
  physicsRelease,
  scrollProgress,
  activeFrame,
}: DeviceProps & {
  mobileOptimized: boolean;
  physicsRelease: MotionValue<number>;
  scrollProgress: MotionValue<number>;
  activeFrame: number;
}) {
  const { size } = useThree();
  const isNarrow = size.width < 760;
  const pendantX = isNarrow ? 0 : 3.2;
  const pendantY = isNarrow ? -0.62 : -0.14;
  const devicePosition: [number, number, number] = [pendantX, pendantY, 0];
  const staticFallback = (
    <StaticPendantFallback
      reduceMotion={reduceMotion}
      settings={settings}
      position={devicePosition}
      onWakeChange={onWakeChange}
      onActivate={onActivate}
      forceAwake={mobileOptimized && activeFrame === 0}
      interactionEnabled={!mobileOptimized || activeFrame !== 1}
    />
  );
  return (
    <>
      <RendererSettings exposure={settings.stage.exposure} />
      <color attach="background" args={[settings.stage.background]} />
      <fog
        attach="fog"
        args={[settings.stage.fogColor, isNarrow ? 16 : 15, isNarrow ? 28 : 26]}
      />
      <ScrollCamera
        cameraSettings={settings.camera}
        isNarrow={isNarrow}
        progress={scrollProgress}
        reduceMotion={reduceMotion}
      />
      <WorldConveyor
        reduceMotion={reduceMotion}
        settings={settings}
        progress={scrollProgress}
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
        position={[
          settings.stage.keyPosition.x,
          settings.stage.keyPosition.y,
          settings.stage.keyPosition.z,
        ]}
        color={settings.stage.keyColor}
        intensity={settings.stage.keyIntensity}
        angle={0.34}
        penumbra={0.9}
        distance={11}
      />
      <spotLight
        position={[
          settings.stage.fillPosition.x,
          settings.stage.fillPosition.y,
          settings.stage.fillPosition.z,
        ]}
        color={settings.stage.fillColor}
        intensity={settings.stage.fillIntensity}
        angle={0.28}
        penumbra={1}
        distance={10}
      />
      <pointLight
        position={[
          settings.stage.rimPosition.x,
          settings.stage.rimPosition.y,
          settings.stage.rimPosition.z,
        ]}
        color={settings.stage.rimColor}
        intensity={settings.stage.rimIntensity}
        distance={7}
      />

      <ArchitecturalBlocks
        pendantX={pendantX}
        platformTop={pendantY - 1.8}
        backdropTop={isNarrow ? 3.7 : 4.05}
        sideTop={pendantY + 1.3}
        settings={settings}
      />
      <Atmosphere
        mobileOptimized={mobileOptimized}
        reduceMotion={reduceMotion}
        positionX={pendantX}
        settings={settings}
      />

      {!reduceMotion && !mobileOptimized ? (
        <PhysicsBoundary fallback={staticFallback}>
          <Suspense fallback={staticFallback}>
            <Physics
              gravity={[0, -14, 0]}
              timeStep="vary"
              interpolate
              numSolverIterations={5}
              numInternalPgsIterations={1}
            >
              <PendantRig
                reduceMotion={reduceMotion}
                settings={settings}
                position={devicePosition}
                onWakeChange={onWakeChange}
                onActivate={onActivate}
                physicsRelease={physicsRelease}
              />
            </Physics>
          </Suspense>
        </PhysicsBoundary>
      ) : staticFallback}

      <Suspense fallback={null}>
        <Environment resolution={mobileOptimized ? 32 : 64}>
          <group rotation={[0, 0, Math.PI / 6]}>
            <Lightformer
              form="rect"
              intensity={settings.environment.keyIntensity}
              color={settings.environment.keyColor}
              position={[
                settings.environment.keyPosition.x,
                settings.environment.keyPosition.y,
                settings.environment.keyPosition.z,
              ]}
              scale={[1.2, 4, 1]}
            />
            <Lightformer
              form="rect"
              intensity={settings.environment.sideIntensity}
              color={settings.environment.sideColor}
              position={[
                settings.environment.sidePosition.x,
                settings.environment.sidePosition.y,
                settings.environment.sidePosition.z,
              ]}
              scale={[1, 3, 1]}
              rotation={[0, -Math.PI / 2, 0]}
            />
            <Lightformer
              form="ring"
              intensity={settings.environment.ringIntensity}
              color={settings.environment.ringColor}
              position={[
                settings.environment.ringPosition.x,
                settings.environment.ringPosition.y,
                settings.environment.ringPosition.z,
              ]}
              scale={2.5}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        </Environment>
      </Suspense>

      <CinematicEffects
        activeFrame={activeFrame}
        mobileOptimized={mobileOptimized}
        settings={settings}
      />

    </>
  );
}
