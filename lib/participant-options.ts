/** Pilihan data peserta (ukuran baju, mode kehadiran) yang dipakai profil, ekspor, dan PDF. */
export const UKURAN_BAJU = ["S", "M", "L", "XL", "XXL", "3XL"] as const;

export const MODE_KEHADIRAN = ["offline", "online"] as const;

export const MODE_KEHADIRAN_LABEL: Record<(typeof MODE_KEHADIRAN)[number], string> = {
  offline: "Offline (hadir langsung)",
  online: "Online via Zoom",
};
