/**
 * Memecah judul acara "Rapat Kerja Nasional BMH 2027" menjadi
 * { lead: "Rapat Kerja Nasional", word: "BMH", year: "2027" } untuk tata letak judul
 * dua baris (hero beranda dan gambar OG). Null bila judul tidak diakhiri "<kata> <tahun>".
 */
export function splitEventTitle(title: string): { lead: string; word: string; year: string } | null {
  const match = title.match(/^(.*)\s+(\S+)\s+(\d{4})$/);
  return match ? { lead: match[1], word: match[2], year: match[3] } : null;
}
