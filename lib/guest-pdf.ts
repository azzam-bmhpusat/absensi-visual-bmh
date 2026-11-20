import { MODE_KEHADIRAN_LABEL } from "./participant-options";

export type GuestModeFilter = "all" | "offline" | "online";

export interface GuestPdfRow {
  nama: string;
  perwakilan_daerah: string;
  jabatan?: string | null;
  departemen?: string | null;
  ukuran_baju?: string | null;
  mode_kehadiran?: string | null;
}

export const GUEST_MODE_FILTER_LABEL: Record<GuestModeFilter, string> = {
  all: "Semua kehadiran",
  offline: "Offline",
  online: "Online via Zoom",
};

/** Tamu tanpa data kehadiran (data lama) hanya ikut filter "Semua". */
export function filterGuestsByMode<T extends Pick<GuestPdfRow, "mode_kehadiran">>(
  guests: T[],
  mode: GuestModeFilter
): T[] {
  if (mode === "all") return guests;
  return guests.filter((g) => g.mode_kehadiran === mode);
}

function modeLabel(mode: string | null | undefined): string {
  if (mode === "offline" || mode === "online") return MODE_KEHADIRAN_LABEL[mode];
  return "-";
}

/**
 * Membuat PDF daftar tamu undangan. Library dimuat dinamis (hanya saat tombol diklik)
 * agar tidak menambah ukuran bundle halaman admin. Baris sudah difilter oleh pemanggil.
 */
export async function exportGuestsPdf(
  guests: GuestPdfRow[],
  options: { mode?: Exclude<GuestModeFilter, "all"> } = {}
): Promise<void> {
  const { mode } = options;
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const printedAt = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  });
  const filterLabel = mode ? GUEST_MODE_FILTER_LABEL[mode] : "Semua";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(
    mode
      ? `Daftar Tamu Undangan Rakernas BMH 2027 - ${GUEST_MODE_FILTER_LABEL[mode]}`
      : "Daftar Tamu Undangan Rakernas BMH 2027",
    40,
    44
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Dicetak: ${printedAt} WIB  |  Filter kehadiran: ${filterLabel}  |  Total: ${guests.length} tamu`,
    40,
    60
  );

  autoTable(doc, {
    startY: 74,
    head: [["No", "Nama", "Perwakilan / Asal", "Jabatan", "Departemen", "Ukuran Baju", "Kehadiran"]],
    body: guests.map((g, i) => [
      String(i + 1),
      g.nama,
      g.perwakilan_daerah,
      g.jabatan || "-",
      g.departemen || "-",
      g.ukuran_baju || "-",
      modeLabel(g.mode_kehadiran),
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [9, 80, 70], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 248, 246] },
    columnStyles: { 0: { cellWidth: 26, halign: "center" }, 5: { cellWidth: 52, halign: "center" } },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const page = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Halaman ${page}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, {
        align: "right",
      });
    },
  });

  doc.save(`tamu-undangan-rakernas-bmh-2027${mode ? `-${mode}` : ""}.pdf`);
}
