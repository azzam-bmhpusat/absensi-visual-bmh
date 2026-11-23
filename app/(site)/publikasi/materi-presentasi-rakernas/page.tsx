import type { Metadata } from "next";
import { Suspense } from "react";
import { Presentation } from "lucide-react";
import { ComingSoon } from "@/components/rakernas/coming-soon";
import { ProfileGate } from "@/components/rakernas/profile-gate";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Materi Presentasi Rakernas";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/publikasi/materi-presentasi-rakernas" }),
};

export default function MateriPresentasiRakernasPage() {
  return (
    <PublicPage title={TITLE}>
      <Suspense fallback={null}>
        <ProfileGate path="/publikasi/materi-presentasi-rakernas">
          <ComingSoon
            icon={Presentation}
            title="Materi presentasi sedang disiapkan"
            description="Materi presentasi dari setiap sesi Rakernas akan tersedia untuk diunduh di sini."
          />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
