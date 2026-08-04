import type { Metadata } from "next";
import DeviceLab from "@/components/device-lab/DeviceLab";

export const metadata: Metadata = {
  title: "Omi Wearable — 3D Study",
  description: "A standalone interactive material and lighting study of the Omi wearable.",
};

export default function DeviceLabPage() {
  return <DeviceLab />;
}
