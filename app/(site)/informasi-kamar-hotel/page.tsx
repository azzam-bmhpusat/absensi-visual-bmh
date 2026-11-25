import type { Metadata } from "next";
import { Suspense } from "react";
import { HotelHero, HotelInfo } from "@/components/rakernas/hotel-info";
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
    <PublicPage notice title={TITLE} hero={<HotelHero title={TITLE} />}>
      <Suspense fallback={null}>
        <ProfileGate path="/informasi-kamar-hotel">
          <HotelInfo />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
