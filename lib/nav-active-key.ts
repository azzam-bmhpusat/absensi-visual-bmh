/** Kunci menu navbar; satu-satunya penentu item aktif dan posisi indikator. */
export type NavKey =
  | "beranda"
  | "rundown"
  | "dresscode"
  | "kamar-hotel"
  | "publikasi"
  | "profile";

/** Batas scrollY (px) yang masih dianggap "paling atas" beranda. */
export const TOP_THRESHOLD_PX = 48;

/** Href menu ("/", "#rundown", "/publikasi/...") atau hash URL ("#top") → kunci menu. */
export function keyForHref(href: string): NavKey | null {
  if (href === "/" || href === "#top") return "beranda";
  if (href === "#rundown") return "rundown";
  if (href === "#dresscode") return "dresscode";
  if (href.startsWith("/informasi-kamar-hotel")) return "kamar-hotel";
  if (href.startsWith("/publikasi")) return "publikasi";
  if (href.startsWith("/profile")) return "profile";
  return null;
}

/**
 * Kunci hasil scroll-spy beranda: section yang melintasi garis baca; bila tidak ada,
 * Beranda hanya di dekat paling atas, selain itu pertahankan kunci sebelumnya (tanpa kedip).
 */
export function resolveSpyKey({
  sectionKey,
  scrollY,
  previous,
}: {
  sectionKey: NavKey | null;
  scrollY: number;
  previous: NavKey;
}): NavKey {
  if (sectionKey) return sectionKey;
  return scrollY < TOP_THRESHOLD_PX ? "beranda" : previous;
}
