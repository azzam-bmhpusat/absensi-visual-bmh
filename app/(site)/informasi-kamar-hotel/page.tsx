import type { Metadata } from "next";
import { PublicPage } from "@/components/rakernas/public-page";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const TITLE = "Informasi Kamar Hotel";

export const metadata: Metadata = {
  title: TITLE,
  ...buildSocialMetadata({ title: TITLE, path: "/informasi-kamar-hotel" }),
};

export default function InformasiKamarHotelPage() {
  return <PublicPage title={TITLE} />;
}
