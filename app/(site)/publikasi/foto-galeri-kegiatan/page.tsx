import type { Metadata } from "next";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Foto Galeri Kegiatan";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/publikasi/foto-galeri-kegiatan" }),
};

export default function FotoGaleriKegiatanPage() {
  return <PublicPage title={TITLE} />;
}
