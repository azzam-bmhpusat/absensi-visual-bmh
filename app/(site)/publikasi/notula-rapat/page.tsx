import type { Metadata } from "next";
import { Suspense } from "react";
import { NotebookPen } from "lucide-react";
import { NotulaRapat } from "@/components/rakernas/notula-rapat";
import { PageHero } from "@/components/rakernas/page-hero";
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
    <PublicPage
      title={TITLE}
      hero={
        <PageHero
          fullHeight={false}
          title={TITLE}
          badge={{ icon: NotebookPen, label: "Hasil Rapat" }}
          description="Notula dan ringkasan keputusan rapat Rakernas BMH sebagai acuan tindak lanjut."
          image="/galeri-fasilitas-hotel/belakang-gedung.jpg"
        />
      }
    >
      <Suspense fallback={null}>
        <ProfileGate path="/publikasi/notula-rapat">
          <NotulaRapat />
        </ProfileGate>
      </Suspense>
    </PublicPage>
  );
}
