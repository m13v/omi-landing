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

export interface ParticleLayerSettings {
  color: string;
  count: number;
  size: number;
  speed: number;
  opacity: number;
  noise: number;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
}

export interface CameraPoseSettings {
  position: {
    x: number;
    y: number;
    z: number;
  };
  target: {
    x: number;
    y: number;
    z: number;
  };
  fov: number;
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
  architecture: {
    textureEnabled: boolean;
    textureRepeat: number;
    textureContrast: number;
    textureSeed: number;
    platform: SurfaceSettings;
    backdrop: SurfaceSettings;
  };
  particles: {
    enabled: boolean;
    dust: ParticleLayerSettings;
    glow: ParticleLayerSettings;
  };
  led: {
    outerColor: string;
    outerOpacity: number;
    innerColor: string;
    innerOpacity: number;
    coreColor: string;
    lightColor: string;
    lightIntensity: number;
  };
  camera: {
    frame1: CameraPoseSettings;
    frame2: CameraPoseSettings;
    frame3: CameraPoseSettings;
    frame4: CameraPoseSettings;
  };
  conveyor: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
      z: number;
    };
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
    keyPosition: {
      x: number;
      y: number;
      z: number;
    };
    fillColor: string;
    fillIntensity: number;
    fillPosition: {
      x: number;
      y: number;
      z: number;
    };
    rimColor: string;
    rimIntensity: number;
    rimPosition: {
      x: number;
      y: number;
      z: number;
    };
    exposure: number;
  };
  environment: {
    keyColor: string;
    keyIntensity: number;
    keyPosition: {
      x: number;
      y: number;
      z: number;
    };
    sideColor: string;
    sideIntensity: number;
    sidePosition: {
      x: number;
      y: number;
      z: number;
    };
    ringColor: string;
    ringIntensity: number;
    ringPosition: {
      x: number;
      y: number;
      z: number;
    };
  };
  postProcessing: {
    enabled: boolean;
    bloom: {
      enabled: boolean;
      intensity: number;
      threshold: number;
      smoothing: number;
      radius: number;
    };
    depthOfField: {
      enabled: boolean;
      focusDistance: number;
      focusRange: number;
      focalLength: number;
      bokehScale: number;
      resolutionScale: number;
    };
    colorGrade: {
      enabled: boolean;
      brightness: number;
      contrast: number;
      saturation: number;
      hue: number;
    };
    vignette: {
      enabled: boolean;
      offset: number;
      darkness: number;
    };
    grain: {
      enabled: boolean;
      opacity: number;
      premultiply: boolean;
    };
    chromaticAberration: {
      enabled: boolean;
      offsetX: number;
      offsetY: number;
      radialModulation: boolean;
      modulationOffset: number;
    };
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
    architecture: {
      textureEnabled: true,
      textureRepeat: 18,
      textureContrast: 0.22,
      textureSeed: 7319,
      platform: {
        color: "#262626",
        metalness: 0,
        roughness: 0.7,
        clearcoat: 0.04,
        clearcoatRoughness: 0.7,
        bumpScale: 0.018,
        envMapIntensity: 0.18,
      },
      backdrop: {
        color: "#1c1c1c",
        metalness: 0,
        roughness: 0.88,
        clearcoat: 0.02,
        clearcoatRoughness: 0.8,
        bumpScale: 0.012,
        envMapIntensity: 0.12,
      },
    },
    particles: {
      enabled: true,
      dust: {
        color: "#a9bbdf",
        count: 15,
        size: 2.7,
        speed: 0.03,
        opacity: 0.18,
        noise: 0.6,
        spreadX: 7.9,
        spreadY: 4.9,
        spreadZ: 3.4,
      },
      glow: {
        color: "#b188b4",
        count: 34,
        size: 3.2,
        speed: 0.035,
        opacity: 0.33,
        noise: 0.7,
        spreadX: 6.3,
        spreadY: 8.9,
        spreadZ: 2.6,
      },
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
    camera: {
      frame1: {
        position: { x: 1.19, y: 0, z: 2.07 },
        target: { x: 3.15, y: 0.08, z: 0 },
        fov: 31,
      },
      frame2: {
        position: { x: 0, y: 0.08, z: 14.8 },
        target: { x: 0.7, y: -0.02, z: 0 },
        fov: 31,
      },
      frame3: {
        position: { x: 20.03, y: -3.79, z: 5.72 },
        target: { x: -30, y: -30, z: 0.64 },
        fov: 31,
      },
      frame4: {
        position: { x: 20.03, y: -12.66, z: 5.72 },
        target: { x: -30, y: -30, z: 0.64 },
        fov: 31,
      },
    },
    conveyor: {
      position: { x: -4.14, y: 0.06, z: -8.19 },
      rotation: { x: -34.1, y: 0, z: -8.9 },
    },
    stage: {
      background: "#121212",
      fogColor: "#4d4d4d",
      ambientColor: "#ffffff",
      ambientIntensity: 0.31,
      hemisphereSky: "#edf3ff",
      hemisphereGround: "#11141a",
      hemisphereIntensity: 2.49,
      keyColor: "#a8c6ff",
      keyIntensity: 206,
      keyPosition: {
        x: -3.8,
        y: 4.5,
        z: 5,
      },
      fillColor: "#ffffff",
      fillIntensity: 197,
      fillPosition: {
        x: 4.5,
        y: 1.1,
        z: 3.6,
      },
      rimColor: "#214aaf",
      rimIntensity: 21,
      rimPosition: {
        x: -0.7,
        y: 3.7,
        z: 1.5,
      },
      exposure: 1.4,
    },
    environment: {
      keyColor: "#e8f1ff",
      keyIntensity: 5.2,
      keyPosition: {
        x: -5.1,
        y: 5.2,
        z: -0.7,
      },
      sideColor: "#b9c7dd",
      sideIntensity: 4.5,
      sidePosition: {
        x: 0.4,
        y: -0.7,
        z: 1,
      },
      ringColor: "#b188b4",
      ringIntensity: 9.7,
      ringPosition: {
        x: 0,
        y: -4,
        z: 1,
      },
    },
    postProcessing: {
      enabled: true,
      bloom: {
        enabled: true,
        intensity: 2.11,
        threshold: 0.2,
        smoothing: 0.42,
        radius: 0.59,
      },
      depthOfField: {
        enabled: true,
        focusDistance: 14.55,
        focusRange: 3.06,
        focalLength: 0.038,
        bokehScale: 2.4,
        resolutionScale: 0.6,
      },
      colorGrade: {
        enabled: true,
        brightness: 0,
        contrast: 0.16,
        saturation: -0.04,
        hue: 0,
      },
      vignette: {
        enabled: true,
        offset: 0.2,
        darkness: 0.67,
      },
      grain: {
        enabled: true,
        opacity: 0.194,
        premultiply: true,
      },
      chromaticAberration: {
        enabled: true,
        offsetX: 0.00055,
        offsetY: 0.00055,
        radialModulation: false,
        modulationOffset: 0.5,
      },
    },
  };
}
