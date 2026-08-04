export interface SurfaceSettings {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  bumpScale: number;
  envMapIntensity: number;
}

export interface PlasticSurfaceSettings extends SurfaceSettings {
  transmission: number;
  thickness: number;
  ior: number;
  attenuationColor: string;
  attenuationDistance: number;
  noiseEnabled: boolean;
  noiseScale: number;
  noiseContrast: number;
  noiseSeed: number;
}

export interface LabSettings {
  texture: {
    enabled: boolean;
    repeat: number;
    contrast: number;
  };
  cord: {
    color: string;
    metalness: number;
    roughness: number;
    bumpScale: number;
  };
  shell: PlasticSurfaceSettings;
  seam: SurfaceSettings;
  bezel: SurfaceSettings;
  core: SurfaceSettings;
  led: {
    outerColor: string;
    outerOpacity: number;
    innerColor: string;
    innerOpacity: number;
    coreColor: string;
    lightColor: string;
    lightIntensity: number;
  };
  stage: {
    background: string;
    fogColor: string;
    ambientColor: string;
    ambientIntensity: number;
    hemisphereSky: string;
    hemisphereGround: string;
    hemisphereIntensity: number;
    keyColor: string;
    keyIntensity: number;
    fillColor: string;
    fillIntensity: number;
    rimColor: string;
    rimIntensity: number;
    exposure: number;
  };
  environment: {
    keyColor: string;
    keyIntensity: number;
    sideColor: string;
    sideIntensity: number;
    ringColor: string;
    ringIntensity: number;
  };
}

export function createDefaultLabSettings(): LabSettings {
  return {
    texture: {
      enabled: true,
      repeat: 8,
      contrast: 0.68,
    },
    cord: {
      color: "#373a3e",
      metalness: 0.16,
      roughness: 0.58,
      bumpScale: 0,
    },
    shell: {
      color: "#ededed",
      metalness: 0,
      roughness: 0.45,
      clearcoat: 0.71,
      clearcoatRoughness: 0.59,
      bumpScale: 0.108,
      envMapIntensity: 0.84,
      transmission: 0.94,
      thickness: 1.35,
      ior: 1.556,
      attenuationColor: "#8fa3bd",
      attenuationDistance: 2.65,
      noiseEnabled: true,
      noiseScale: 3.25,
      noiseContrast: 3.45,
      noiseSeed: 4491,
    },
    seam: {
      color: "#ededed",
      metalness: 1,
      roughness: 0.37,
      clearcoat: 0.28,
      clearcoatRoughness: 0.16,
      bumpScale: 0.056,
      envMapIntensity: 1.04,
    },
    bezel: {
      color: "#ededed",
      metalness: 1,
      roughness: 0.37,
      clearcoat: 0.28,
      clearcoatRoughness: 0.16,
      bumpScale: 0.056,
      envMapIntensity: 1.04,
    },
    core: {
      color: "#ededed",
      metalness: 1,
      roughness: 0.37,
      clearcoat: 0.28,
      clearcoatRoughness: 0.16,
      bumpScale: 0.056,
      envMapIntensity: 1.04,
    },
    led: {
      outerColor: "#326eff",
      outerOpacity: 0.09,
      innerColor: "#4f83ff",
      innerOpacity: 0.24,
      coreColor: "#e3edff",
      lightColor: "#2f6fff",
      lightIntensity: 1.35,
    },
    stage: {
      background: "#121212",
      fogColor: "#4d4d4d",
      ambientColor: "#ffffff",
      ambientIntensity: 0.96,
      hemisphereSky: "#edf3ff",
      hemisphereGround: "#11141a",
      hemisphereIntensity: 0,
      keyColor: "#a8c6ff",
      keyIntensity: 115,
      fillColor: "#ffffff",
      fillIntensity: 88,
      rimColor: "#214aaf",
      rimIntensity: 22,
      exposure: 0.8,
    },
    environment: {
      keyColor: "#e8f1ff",
      keyIntensity: 8.2,
      sideColor: "#b9c7dd",
      sideIntensity: 0.6,
      ringColor: "#b188b4",
      ringIntensity: 10.8,
    },
  };
}
