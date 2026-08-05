"use client";

import dynamic from "next/dynamic";
import styles from "@/components/device-lab/device-lab.module.css";

const DeviceLab = dynamic(() => import("@/components/device-lab/DeviceLab"), {
  ssr: false,
  loading: () => (
    <main className={styles.loadingShell} aria-label="Loading the Omi experience">
      <img src="/images/omi-logo.png" width="118" height="52" alt="Omi" />
      <span>Loading the wearable</span>
    </main>
  ),
});

export default function DeviceLabLoader() {
  return <DeviceLab />;
}
