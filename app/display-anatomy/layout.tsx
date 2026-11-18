import type { Metadata } from "next";
import "@/components/iso/iso.css";
import "@/components/figures/display/display-anatomy.css";

export const metadata: Metadata = {
  title: "Videotron Anatomy",
  description: "Layar kehadiran realtime peserta acara BMH dalam figur Anatomy",
  robots: { index: false, follow: false, nocache: true },
};

export default function DisplayAnatomyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
