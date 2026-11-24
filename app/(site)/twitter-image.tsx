import { EVENT_INFO } from "@/content/rakernas";
import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = EVENT_INFO.title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgCard();
}
