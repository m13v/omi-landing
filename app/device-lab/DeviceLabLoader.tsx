"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { DeviceLabProps } from "@/components/device-lab/DeviceLab";
import styles from "@/components/device-lab/device-lab.module.css";

const DeviceLab = dynamic<DeviceLabProps>(
  () => import("@/components/device-lab/DeviceLab"),
  { ssr: false, loading: () => null },
);

const PENDANT_SLOTS = Array.from({ length: 8 }, (_, index) => index);

function PendantOutline() {
  return (
    <svg viewBox="0 0 120 148" aria-hidden="true">
      <path d="M52 27V17c0-7 3-11 8-11s8 4 8 11v10" />
      <path d="M48 31c2-5 6-8 12-8s10 3 12 8" />
      <circle cx="60" cy="81" r="43" />
      <circle cx="60" cy="81" r="34" />
      <circle className={styles.fabricationLed} cx="60" cy="81" r="2.5" />
    </svg>
  );
}

function FabricationLoader({ progress, exiting }: {
  progress: number;
  exiting: boolean;
}) {
  return (
    <div
      className={`${styles.fabricationLoader} ${exiting ? styles.fabricationLoaderExit : ""}`}
      role="status"
      aria-label="Fabricating your Omi"
    >
      <div className={styles.fabricationGlow} aria-hidden="true" />

      <div className={styles.fabricationCenter}>
        <h1>Fabricating your Omi</h1>

        <div className={styles.fabricationConveyor} aria-hidden="true">
          <span className={styles.fabricationRailTop} />
          <div className={styles.fabricationTrack}>
            {PENDANT_SLOTS.map((slot) => (
              <div className={styles.fabricationPendant} key={slot}>
                <PendantOutline />
              </div>
            ))}
          </div>
          <span className={styles.fabricationRailBottom} />
        </div>
      </div>

      <div className={styles.fabricationProgress} aria-hidden="true">
        <span>{String(progress).padStart(3, "0")}</span>
        <i style={{ transform: `scaleY(${progress / 100})` }} />
      </div>
    </div>
  );
}

export default function DeviceLabLoader() {
  const [progress, setProgress] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [loaderRemoved, setLoaderRemoved] = useState(false);

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), 1350);
    return () => window.clearTimeout(minimumTimer);
  }, []);

  useEffect(() => {
    const startedAt = window.performance.now();
    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (sceneReady && minimumElapsed) {
          return Math.min(100, current + Math.max(1, Math.ceil((100 - current) * 0.22)));
        }

        const elapsed = window.performance.now() - startedAt;
        const staged = Math.floor(92 * (1 - Math.exp(-elapsed / 720)));
        return Math.max(current, Math.min(92, staged));
      });
    }, 45);

    return () => window.clearInterval(progressTimer);
  }, [minimumElapsed, sceneReady]);

  useEffect(() => {
    if (!sceneReady || progress < 100) return;
    const exitTimer = window.setTimeout(() => setExiting(true), 180);
    const removeTimer = window.setTimeout(() => setLoaderRemoved(true), 900);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [progress, sceneReady]);

  useEffect(() => {
    if (loaderRemoved) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [loaderRemoved]);

  return (
    <>
      <DeviceLab onReady={() => setSceneReady(true)} />
      {!loaderRemoved && <FabricationLoader progress={progress} exiting={exiting} />}
    </>
  );
}
