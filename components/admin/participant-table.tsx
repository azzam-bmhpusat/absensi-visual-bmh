"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatArrival, whatsappLink } from "@/lib/profile-contact";
import { MODE_KEHADIRAN_LABEL } from "@/lib/participant-options";

export interface ParticipantRow {
  id: string;
  isAdmin: boolean;
  nama: string;
  email: string;
  perwakilanDaerah: string;
  jabatan: string;
  ukuranBaju: string;
  noWhatsapp: string;
  rencanaKedatangan: string | null;
  keteranganKehadiran: string;
}

const dash = <span className="text-ink-muted">-</span>;

export function ParticipantTable({ rows }: { rows: ParticipantRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.nama, r.email, r.perwakilanDaerah, r.jabatan, r.noWhatsapp].some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const [exporting, setExporting] = useState(false);

  /** Ekspor baris yang sedang tampil (mengikuti pencarian) ke .xlsx. */
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Data Peserta");
      ws.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "Nama", key: "nama", width: 28 },
        { header: "Email", key: "email", width: 30 },
        { header: "Perwakilan Daerah", key: "daerah", width: 24 },
        { header: "Jabatan", key: "jabatan", width: 22 },
        { header: "Ukuran Baju", key: "baju", width: 12 },
        { header: "No WhatsApp", key: "wa", width: 18 },
        { header: "Rencana Kedatangan", key: "datang", width: 34 },
        { header: "Keterangan Kehadiran", key: "hadir", width: 22 },
        { header: "Role", key: "role", width: 10 },
      ];
      filtered.forEach((r, i) => {
        const mode = r.keteranganKehadiran as keyof typeof MODE_KEHADIRAN_LABEL;
        const wa = whatsappLink(r.noWhatsapp);
        const row = ws.addRow({
          no: i + 1,
          nama: r.nama,
          email: r.email,
          daerah: r.perwakilanDaerah,
          jabatan: r.jabatan,
          baju: r.ukuranBaju,
          wa: wa ? { text: r.noWhatsapp, hyperlink: wa } : "",
          datang: formatArrival(r.rencanaKedatangan) ?? "",
          hadir: MODE_KEHADIRAN_LABEL[mode] ?? "",
          role: r.isAdmin ? "Admin" : "User",
        });
        if (wa) row.getCell("wa").font = { color: { argb: "FF0563C1" }, underline: true };
      });
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF134B40" } };
      ws.views = [{ state: "frozen", ySplit: 1 }];
      ws.autoFilter = { from: "A1", to: "J1" };

      const buffer = await wb.xlsx.writeBuffer();
      const url = URL.createObjectURL(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      );
      const stamp = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
      const link = document.createElement("a");
      link.href = url;
      link.download = `data-peserta-rakernas-bmh-${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`${filtered.length} peserta berhasil diekspor.`);
    } catch (err) {
      console.error("Gagal ekspor data peserta:", err);
      toast.error("Gagal mengekspor Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Data Peserta</h1>
          <p className="text-xs text-ink-muted">
            {filtered.length} dari {rows.length} peserta
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, daerah..."
              aria-label="Cari peserta"
              className="h-10 rounded-xl border-line pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            className="h-10 shrink-0 rounded-xl bg-primary px-4 text-white hover:bg-brand-green-deep"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            <span className="ml-1.5">Export Excel</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-3 py-3">No</th>
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Perwakilan Daerah</th>
              <th className="px-3 py-3">Jabatan</th>
              <th className="px-3 py-3">Ukuran Baju</th>
              <th className="px-3 py-3">No WhatsApp</th>
              <th className="px-3 py-3">Rencana Kedatangan</th>
              <th className="px-3 py-3">Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-ink-muted">
                  Tidak ada peserta.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const wa = whatsappLink(r.noWhatsapp);
                const mode = r.keteranganKehadiran as keyof typeof MODE_KEHADIRAN_LABEL;
                return (
                  <tr key={r.id} className="align-top hover:bg-muted/20">
                    <td className="px-3 py-3 text-ink-muted">{i + 1}</td>
                    <td className="px-3 py-3 font-medium text-primary">
                      {r.nama || <span className="font-normal italic text-ink-muted">(belum diisi)</span>}
                      {r.isAdmin && (
                        <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-brand-gold-text">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{r.email || dash}</td>
                    <td className="px-3 py-3">{r.perwakilanDaerah || dash}</td>
                    <td className="px-3 py-3">{r.jabatan || dash}</td>
                    <td className="px-3 py-3">{r.ukuranBaju || dash}</td>
                    <td className="px-3 py-3">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand-green-text underline underline-offset-2 hover:text-primary"
                        >
                          {r.noWhatsapp}
                        </a>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="px-3 py-3">{formatArrival(r.rencanaKedatangan) ?? dash}</td>
                    <td className="px-3 py-3">{MODE_KEHADIRAN_LABEL[mode] ?? dash}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
