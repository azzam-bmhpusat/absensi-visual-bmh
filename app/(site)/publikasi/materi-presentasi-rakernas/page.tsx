import type { Metadata } from "next";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Materi Presentasi Rakernas";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/publikasi/materi-presentasi-rakernas" }),
};

export default function MateriPresentasiRakernasPage() {
  return <PublicPage title={TITLE} />;
}
