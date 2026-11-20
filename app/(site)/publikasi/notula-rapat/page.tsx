import type { Metadata } from "next";
import { Suspense } from "react";
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
        <ProfileGate path="/publikasi/notula-rapat" />
      </Suspense>
    </PublicPage>
  );
}
