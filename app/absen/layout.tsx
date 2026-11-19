import type { Metadata } from "next";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export const metadata: Metadata = {
  title: "Absensi Peserta",
  description: "Formulir pencatatan kehadiran peserta acara BMH secara cepat dan mudah",
};

export default function AbsenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
