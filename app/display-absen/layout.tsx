import type { Metadata } from "next";
import "@/components/iso/iso.css";
import "@/components/figures/display/display-anatomy.css";

export const metadata: Metadata = {
  title: "Aula Kehadiran Realtime",
  description: "Layar kehadiran realtime peserta acara BMH: panggung, tribun, dan tamu yang baru absen",
  robots: { index: false, follow: false, nocache: true },
};

export default function DisplayAbsenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
