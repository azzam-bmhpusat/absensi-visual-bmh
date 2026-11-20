import {
  MODE_KEHADIRAN_LABEL,
  REGISTRATION_STATUS_LABEL,
} from "./registration-schema";

export interface RegistrationRow {
  id: string;
  nama: string;
  perwakilan_bmh: string;
  jabatan: string;
  departemen: string | null;
  ukuran_baju: string;
  mode_kehadiran: "offline" | "online";
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function formatRegistrationDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Membuat PDF daftar seluruh pendaftar. Library dimuat dinamis (hanya saat tombol diklik)
 * agar tidak menambah ukuran bundle halaman admin.
 */
export interface ExportPdfOptions {
  /** Batasi ke satu jenis kehadiran; kosong = semua. Baris sudah difilter oleh pemanggil. */
  mode?: RegistrationRow["mode_kehadiran"];
}

const MODE_TITLE_SUFFIX: Record<RegistrationRow["mode_kehadiran"], string> = {
  offline: "Offline",
  online: "Online via Zoom",
};

export async function exportRegistrationsPdf(
  rows: RegistrationRow[],
  options: ExportPdfOptions = {}
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(
    mode
      ? `Daftar Pendaftar Rakernas BMH 2027 - ${MODE_TITLE_SUFFIX[mode]}`
      : "Daftar Pendaftar Rakernas BMH 2027",
    40,
    44
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Dicetak: ${printedAt} WIB  |  Filter kehadiran: ${mode ? MODE_TITLE_SUFFIX[mode] : "Semua"}  |  Total: ${rows.length} pendaftar`,
    40,
    60
  );

  autoTable(doc, {
    startY: 74,
    head: [
      [
        "No",
        "Nama Lengkap",
        "Perwakilan BMH",
        "Jabatan",
        "Departemen",
        "Ukuran",
        "Kehadiran",
        "Status",
        "Tanggal Daftar",
      ],
    ],
    body: rows.map((r, i) => [
      String(i + 1),
      r.nama,
      r.perwakilan_bmh,
      r.jabatan,
      r.departemen ?? "-",
      r.ukuran_baju,
      MODE_KEHADIRAN_LABEL[r.mode_kehadiran] ?? r.mode_kehadiran,
      REGISTRATION_STATUS_LABEL[r.status] ?? r.status,
      formatRegistrationDate(r.created_at),
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [9, 80, 70], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 248, 246] },
    columnStyles: { 0: { cellWidth: 26, halign: "center" }, 5: { cellWidth: 40, halign: "center" } },
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

  doc.save(`pendaftar-rakernas-bmh-2027${mode ? `-${mode}` : ""}.pdf`);
}
