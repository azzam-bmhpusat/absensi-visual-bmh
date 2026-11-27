import type { Metadata } from "next";
import { Suspense } from "react";
import { Images } from "lucide-react";
import { GaleriKegiatan } from "@/components/rakernas/galeri-kegiatan";
import { PageHero } from "@/components/rakernas/page-hero";
import { ProfileGate } from "@/components/rakernas/profile-gate";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Foto Galeri Kegiatan";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/publikasi/foto-galeri-kegiatan" }),
};

export default function FotoGaleriKegiatanPage() {
  return (
    <PublicPage
      title={TITLE}
      hero={
        <PageHero
          fullHeight={false}
          title={TITLE}
          badge={{ icon: Images, label: "Dokumentasi" }}
          description="Kumpulan foto dokumentasi kegiatan Rakernas BMH dari setiap sesi dan agenda."
          image="/galeri-fasilitas-hotel/ruang-acara.jpg"
        />
      }
    >
      <Suspense fallback={null}>
        <ProfileGate path="/publikasi/foto-galeri-kegiatan">
          <GaleriKegiatan />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
