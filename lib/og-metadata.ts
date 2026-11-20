import type { Metadata } from "next";
import { EVENT_INFO, EVENT_THEME } from "@/content/rakernas";

// Konten preview link (WhatsApp, dsb.): hanya judul dan tema acara.
// Sengaja TANPA tanggal dan TANPA lokasi/tempat.
export const OG_DESCRIPTION = `Tema: ${EVENT_THEME}`;

export function buildSocialMetadata(options: {
  title?: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const title = options.title ?? EVENT_INFO.title;
  return {
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: EVENT_INFO.name,
      url: options.path,
      title,
      description: OG_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: OG_DESCRIPTION,
    },
  };
}
