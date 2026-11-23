import type { Metadata } from "next";
import { Suspense } from "react";
import { NotebookPen } from "lucide-react";
import { ComingSoon } from "@/components/rakernas/coming-soon";
import { ProfileGate } from "@/components/rakernas/profile-gate";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Notula Rapat";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/publikasi/notula-rapat" }),
};

export default function NotulaRapatPage() {
  return (
    <PublicPage title={TITLE}>
      <Suspense fallback={null}>
        <ProfileGate path="/publikasi/notula-rapat">
          <ComingSoon
            icon={NotebookPen}
            title="Notula rapat sedang disiapkan"
            description="Notula dan ringkasan hasil rapat akan dipublikasikan di sini setelah sesi selesai."
          />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
