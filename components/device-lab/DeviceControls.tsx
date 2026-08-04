"use client";

import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import type {
  LabSettings,
  PlasticSurfaceSettings,
  SurfaceSettings,
} from "./device-settings";
import styles from "./device-lab.module.css";

function addSurfaceFolder(
  gui: GUI,
  title: string,
  surface: SurfaceSettings | PlasticSurfaceSettings,
) {
  const folder = gui.addFolder(title);
  if (title !== "Unified plastic shell") folder.close();
  folder.addColor(surface, "color").name("color");
  if ("transmission" in surface) {
    folder.add(surface, "transmission", 0, 1, 0.01).name("transmission");
    folder.add(surface, "thickness", 0, 2, 0.01).name("thickness");
    folder.add(surface, "ior", 1, 2.333, 0.001).name("IOR");
    folder.addColor(surface, "attenuationColor").name("absorption color");
    folder
      .add(surface, "attenuationDistance", 0.05, 10, 0.05)
      .name("absorption distance");

    const noise = folder.addFolder("Noise texture");
    noise.add(surface, "noiseEnabled").name("enabled");
    noise.add(surface, "noiseScale", 0.25, 256, 0.25).name("scale / repeat");
    noise.add(surface, "noiseContrast", 0, 8, 0.01).name("contrast");
    noise.add(surface, "noiseSeed", 0, 10000, 1).name("seed");
    noise.add(surface, "bumpScale", -1, 1, 0.001).name("bump strength");
  }
  folder.add(surface, "metalness", 0, 1, 0.01).name("metalness");
  folder.add(surface, "roughness", 0, 1, 0.01).name("roughness");
  folder.add(surface, "clearcoat", 0, 1, 0.01).name("clearcoat");
  folder
    .add(surface, "clearcoatRoughness", 0, 1, 0.01)
    .name("coat roughness");
  if (!("transmission" in surface)) {
    folder.add(surface, "bumpScale", 0, 0.1, 0.001).name("bump scale");
  }
  folder
    .add(surface, "envMapIntensity", 0, 4, 0.01)
    .name("environment");
}

interface DeviceControlsProps {
  settings: LabSettings;
  onChange: () => void;
}

export default function DeviceControls({ settings, onChange }: DeviceControlsProps) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mount.current) return;

    const gui = new GUI({
      container: mount.current,
      title: "Omi material lab",
      width: 320,
    });

    const texture = gui.addFolder("Texture").close();
    texture.add(settings.texture, "enabled").name("grain enabled");
    texture.add(settings.texture, "repeat", 1, 24, 1).name("grain repeat");
    texture.add(settings.texture, "contrast", 0, 1, 0.01).name("grain contrast");

    const cord = gui.addFolder("Cord").close();
    cord.addColor(settings.cord, "color").name("color");
    cord.add(settings.cord, "metalness", 0, 1, 0.01).name("metalness");
    cord.add(settings.cord, "roughness", 0, 1, 0.01).name("roughness");
    cord.add(settings.cord, "bumpScale", 0, 0.1, 0.001).name("bump scale");

    addSurfaceFolder(gui, "Unified plastic shell", settings.shell);
    addSurfaceFolder(gui, "Body seam", settings.seam);
    addSurfaceFolder(gui, "Gunmetal bezel", settings.bezel);
    addSurfaceFolder(gui, "Gunmetal core", settings.core);

    const led = gui.addFolder("LED").close();
    led.addColor(settings.led, "outerColor").name("outer glow");
    led.add(settings.led, "outerOpacity", 0, 1, 0.01).name("outer opacity");
    led.addColor(settings.led, "innerColor").name("inner glow");
    led.add(settings.led, "innerOpacity", 0, 1, 0.01).name("inner opacity");
    led.addColor(settings.led, "coreColor").name("core");
    led.addColor(settings.led, "lightColor").name("light");
    led.add(settings.led, "lightIntensity", 0, 8, 0.05).name("intensity");

    const stage = gui.addFolder("Stage lighting").close();
    stage.addColor(settings.stage, "background").name("background");
    stage.addColor(settings.stage, "fogColor").name("fog");
    stage.addColor(settings.stage, "ambientColor").name("ambient color");
    stage.add(settings.stage, "ambientIntensity", 0, 2, 0.01).name("ambient intensity");
    stage.addColor(settings.stage, "hemisphereSky").name("sky color");
    stage.addColor(settings.stage, "hemisphereGround").name("ground color");
    stage.add(settings.stage, "hemisphereIntensity", 0, 3, 0.01).name("hemisphere");
    stage.addColor(settings.stage, "keyColor").name("key color");
    stage.add(settings.stage, "keyIntensity", 0, 250, 1).name("key intensity");
    stage.addColor(settings.stage, "fillColor").name("fill color");
    stage.add(settings.stage, "fillIntensity", 0, 250, 1).name("fill intensity");
    stage.addColor(settings.stage, "rimColor").name("rim color");
    stage.add(settings.stage, "rimIntensity", 0, 100, 1).name("rim intensity");
    stage.add(settings.stage, "exposure", 0.2, 2.5, 0.01).name("exposure");

    const environment = gui.addFolder("Environment").close();
    environment.addColor(settings.environment, "keyColor").name("key color");
    environment.add(settings.environment, "keyIntensity", 0, 12, 0.1).name("key intensity");
    environment.addColor(settings.environment, "sideColor").name("side color");
    environment.add(settings.environment, "sideIntensity", 0, 12, 0.1).name("side intensity");
    environment.addColor(settings.environment, "ringColor").name("ring color");
    environment.add(settings.environment, "ringIntensity", 0, 12, 0.1).name("ring intensity");

    const actions = {
      copySettings: async () => {
        await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      },
      resetAll: () => {
        gui.reset(true);
        onChange();
      },
    };
    gui.add(actions, "copySettings").name("Copy settings JSON");
    gui.add(actions, "resetAll").name("Reset all");
    gui.onChange(onChange);

    gui.close();

    return () => gui.destroy();
  }, [onChange, settings]);

  return <div ref={mount} className={styles.guiMount} />;
}
