export const PRIVACY_SECTIONS = [
  { id: "data-yang-dikumpulkan", number: "01", title: "Data yang kami kumpulkan" },
  { id: "penggunaan-data", number: "02", title: "Untuk apa data dipakai" },
  { id: "data-publik", number: "03", title: "Data yang tampil untuk umum" },
  { id: "penyimpanan-dan-keamanan", number: "04", title: "Penyimpanan dan keamanan" },
  { id: "hak-dan-penghapusan-data", number: "05", title: "Hak Anda dan penghapusan data" },
  { id: "perubahan-kebijakan", number: "06", title: "Perubahan kebijakan" },
] as const;

export type PrivacySectionId = (typeof PRIVACY_SECTIONS)[number]["id"];

/** Nomor tampilan mengikuti URL kontak pengaturan; href dan pesan aslinya tetap utuh. */
export function getPrivacyContact(footerUrl: string) {
  let phone: string | null = null;
  try {
    const url = new URL(footerUrl);
    const candidate = url.protocol !== "https:" ? null
      : url.hostname === "wa.me" ? url.pathname.match(/^\/([+\d]+)\/?$/)?.[1]
      : url.hostname === "api.whatsapp.com" && url.pathname === "/send" ? url.searchParams.get("phone")
      : null;
    const normalized = candidate?.trim().replace(/[\s()-]/g, "");
    if (normalized && /^\+?\d{7,15}$/.test(normalized)) {
      const digits = normalized.replace(/^\+/, "");
      phone = digits.startsWith("62") ? `0${digits.slice(2)}` : digits.startsWith("0") ? digits : `+${digits}`;
    }
  } catch { /* URL tanpa nomor tetap dapat memakai label kontak umum. */ }

  return { href: footerUrl, phone, label: phone ?? "Hubungi Panitia" };
}
