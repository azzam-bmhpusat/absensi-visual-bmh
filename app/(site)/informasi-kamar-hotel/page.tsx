import type { Metadata } from "next";
import { Suspense } from "react";
import { BedDouble } from "lucide-react";
import { ComingSoon } from "@/components/rakernas/coming-soon";
import { ProfileGate } from "@/components/rakernas/profile-gate";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Informasi Kamar Hotel";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/informasi-kamar-hotel" }),
};

export default function InformasiKamarHotelPage() {
  return (
    <PublicPage title={TITLE}>
      <Suspense fallback={null}>
        <ProfileGate path="/informasi-kamar-hotel">
          <ComingSoon
            icon={BedDouble}
            title="Informasi kamar hotel sedang disiapkan"
            description="Daftar hotel, pembagian kamar, dan detail check-in peserta akan ditampilkan di sini menjelang acara."
          />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
