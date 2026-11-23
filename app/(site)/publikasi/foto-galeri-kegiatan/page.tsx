import type { Metadata } from "next";
import { Suspense } from "react";
import { Images } from "lucide-react";
import { ComingSoon } from "@/components/rakernas/coming-soon";
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
    <PublicPage title={TITLE}>
      <Suspense fallback={null}>
        <ProfileGate path="/publikasi/foto-galeri-kegiatan">
          <ComingSoon
            icon={Images}
            title="Galeri foto sedang disiapkan"
            description="Dokumentasi foto kegiatan Rakernas akan diunggah di sini setelah acara berlangsung."
          />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
