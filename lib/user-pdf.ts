import "server-only";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { USER_EXPORT_COLUMNS, userExportRows, userExportScopeInfo, type UserExportScope } from "./user-export";
import type { UserRow } from "./user-row";

/** `users` harus sudah difilter sesuai scope. PDF dibuat di server. */
export function buildUserPdf(scope: UserExportScope, users: UserRow[], generatedAt = new Date()): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setProperties({ title: "Manajemen User BMH", author: "Absensi BMH" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#0F5132");
  doc.text("Manajemen User BMH", margin, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#374151");

  const timestamp = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(generatedAt);
  const info = [
    ...userExportScopeInfo(scope),
    { k: "Jumlah User", v: String(users.length) },
    { k: "Diekspor", v: `${timestamp} WIB` },
  ];
  let y = 31;
  for (const { k, v } of info) {
    const lines: string[] = doc.splitTextToSize(`${k}: ${v}`, width - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 1;
  }

  const rows = userExportRows(users);
  autoTable(doc, {
    startY: y + 4,
    margin: { top: 28, right: margin, bottom: 20, left: margin },
    head: [USER_EXPORT_COLUMNS.map((c) => c.header)],
    body: rows.length
      ? rows.map((row) => USER_EXPORT_COLUMNS.map((c) => row[c.key]))
      : [[{ content: "Tidak ada pengguna", colSpan: 5, styles: { halign: "center" } }]],
    theme: "striped",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, overflow: "linebreak", valign: "middle", textColor: "#1F2937" },
    headStyles: { fillColor: "#0F5132", textColor: "#FFFFFF", fontStyle: "bold" },
    alternateRowStyles: { fillColor: "#F0F7F3" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 56 },
      2: { cellWidth: 48 },
      3: { cellWidth: 42 },
      4: { cellWidth: 24, halign: "center" },
    },
    showHead: "everyPage",
    rowPageBreak: "avoid",
    willDrawPage: ({ pageNumber }) => {
      if (pageNumber > 1) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor("#0F5132");
        doc.text("Manajemen User BMH", margin, 20);
      }
    },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#6B7280");
    doc.text("Absensi BMH", margin, height - 10);
    doc.text(`Halaman ${page} dari ${pages}`, width - margin, height - 10, { align: "right" });
  }
  return Buffer.from(doc.output("arraybuffer"));
}
