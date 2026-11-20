import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = "Registrasi Peserta Rakernas BMH 2027";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgCard({ badge: "Registrasi Peserta" });
}
