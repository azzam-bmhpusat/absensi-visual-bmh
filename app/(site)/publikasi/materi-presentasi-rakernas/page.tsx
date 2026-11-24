import type { Metadata } from "next";
import { Suspense } from "react";
import { Presentation } from "lucide-react";
import { MateriPresentasi } from "@/components/rakernas/materi-presentasi";
import { PageHero } from "@/components/rakernas/page-hero";
import { ProfileGate } from "@/components/rakernas/profile-gate";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Materi Rakernas";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/publikasi/materi-presentasi-rakernas" }),
};

export default function MateriPresentasiRakernasPage() {
  return (
    <PublicPage
      title={TITLE}
      hero={
        <PageHero
          title={TITLE}
          badge={{ icon: Presentation, label: "Materi Sesi" }}
          description="Unduh materi presentasi para pemateri dari setiap sesi Rakernas BMH."
          image="/galeri-fasilitas-hotel/gedung.jpg"
        />
      }
    >
      <Suspense fallback={null}>
        <ProfileGate path="/publikasi/materi-presentasi-rakernas">
          <MateriPresentasi />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
