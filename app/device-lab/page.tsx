import type { Metadata } from "next";
import DeviceLabLoader from "./DeviceLabLoader";

export const metadata: Metadata = {
  title: "Omi Wearable — Unofficial Interactive Concept",
  description: "An unofficial interactive Three.js product-story concept for the Omi wearable.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeviceLabPage() {
  return <DeviceLabLoader />;
}
