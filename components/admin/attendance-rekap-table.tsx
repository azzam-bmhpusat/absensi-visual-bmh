"use client";

import { useState, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Trash2,
  CheckCircle,
  UserCheck,
  UserPlus,
  Clock,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  exportAttendanceToCsv,
  formatToWibDateTime,
  type SessionInfo,
} from "@/lib/csv";
import { deleteAttendanceAction } from "@/app/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface AttendanceItem {
  id: string;
  session_id: number;
  guest_id?: string | null;
  nama: string;
  perwakilan_daerah: string;
  is_walk_in: boolean;
  checked_in_at: string;
}

interface AttendanceRekapTableProps {
  attendances: AttendanceItem[];
  sessions: SessionInfo[];
}

export function AttendanceRekapTable({
  attendances,
  sessions,
}: AttendanceRekapTableProps) {
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [selectedDaerah, setSelectedDaerah] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedDelete, setSelectedDelete] = useState<AttendanceItem | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Daftar daerah unik untuk dropdown filter
  const uniqueDaerahList = useMemo(() => {
    const set = new Set<string>();
    attendances.forEach((a) => {
      if (a.perwakilan_daerah) set.add(a.perwakilan_daerah);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [attendances]);

  // Sesi map untuk lookup cepat nama sesi
  const sessionNameMap = useMemo(() => {
    return new Map<number, string>(sessions.map((s) => [s.id, s.nama]));
  }, [sessions]);

  // Filter attendances
  const filteredAttendances = useMemo(() => {
    return attendances.filter((item) => {
      // Filter sesi
      if (selectedSessionId !== "all") {
        if (item.session_id !== Number(selectedSessionId)) return false;
      }

      // Filter daerah
      if (selectedDaerah !== "all") {
        if (item.perwakilan_daerah !== selectedDaerah) return false;
      }

      // Filter pencarian nama / daerah
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNama = item.nama.toLowerCase().includes(q);
        const matchDaerah = item.perwakilan_daerah.toLowerCase().includes(q);
        if (!matchNama && !matchDaerah) return false;
      }

      return true;
    });
  }, [attendances, selectedSessionId, selectedDaerah, search]);

  // Metrik statistik
  const metrics = useMemo(() => {
    const total = filteredAttendances.length;
    const registered = filteredAttendances.filter((a) => !a.is_walk_in).length;
    const walkIn = filteredAttendances.filter((a) => a.is_walk_in).length;

    return { total, registered, walkIn };
  }, [filteredAttendances]);

  // Handle ekspor CSV
  const handleExportCsv = () => {
    if (filteredAttendances.length === 0) {
      toast.error("Tidak ada data presensi yang memenuhi filter untuk diekspor.");
      return;
    }

    const csvContent = exportAttendanceToCsv(filteredAttendances, sessions);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const sessionLabel =
      selectedSessionId === "all"
        ? "semua-sesi"
        : `sesi-${selectedSessionId}`;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `rekap-kehadiran-bmh-${sessionLabel}-${timestamp}.csv`;

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Rekap kehadiran (${filteredAttendances.length} baris) berhasil diekspor!`);
  };

  // Handle hapus absensi (FR-18)
  const handleConfirmDelete = () => {
    if (!selectedDelete) return;

    startDeleteTransition(async () => {
      const res = await deleteAttendanceAction(selectedDelete.id);
      if (res.success) {
        toast.success(
          `Catatan kehadiran "${selectedDelete.nama}" berhasil dihapus.`
        );
        setSelectedDelete(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus catatan kehadiran.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-primary">
            <CheckCircle className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-primary">
              {metrics.total}
            </div>
            <div className="text-xs text-ink-muted">Total Kehadiran</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
            <UserCheck className="w-5 h-5 text-brand-green-deep" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-primary">
              {metrics.registered}
            </div>
            <div className="text-xs text-ink-muted">Tamu Terdaftar</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-brand-gold-text">
            <UserPlus className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-brand-gold-text">
              {metrics.walkIn}
            </div>
            <div className="text-xs text-ink-muted">Tamu Baru (Walk-in)</div>
          </div>
        </div>
      </div>

      {/* Kontrol Filter & Ekspor */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-line shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Filter Sesi */}
          <div className="w-44">
            <Select
              value={selectedSessionId}
              onValueChange={(val) => setSelectedSessionId(val ?? "all")}
            >
              <SelectTrigger className="h-9 rounded-xl border-line text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                <SelectValue placeholder="Pilih Sesi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">
                  Semua Sesi
                </SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                    {s.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Daerah */}
          <div className="w-48">
            <Select
              value={selectedDaerah}
              onValueChange={(val) => setSelectedDaerah(val ?? "all")}
            >
              <SelectTrigger className="h-9 rounded-xl border-line text-xs">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-gold-text" />
                <SelectValue placeholder="Semua Daerah" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-56">
                <SelectItem value="all" className="text-xs">
                  Semua Daerah ({uniqueDaerahList.length})
                </SelectItem>
                {uniqueDaerahList.map((daerah) => (
                  <SelectItem key={daerah} value={daerah} className="text-xs">
                    {daerah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pencarian Nama */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau daerah..."
              className="pl-8 h-9 rounded-xl border-line text-xs focus-visible:ring-brand-green"
            />
          </div>
        </div>

        {/* Tombol Ekspor CSV */}
        <Button
          onClick={handleExportCsv}
          disabled={filteredAttendances.length === 0}
          className="h-9 px-3.5 rounded-xl bg-primary hover:bg-brand-green-deep text-white text-xs font-semibold shadow-xs transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-brand-gold-soft" />
          Ekspor CSV (WIB)
        </Button>
      </div>

      {/* Tabel Data Rekap Kehadiran */}
      <div className="border border-line rounded-2xl overflow-hidden bg-white shadow-2xs">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-line hover:bg-muted">
              <TableHead className="w-12 text-center text-xs font-bold text-primary">
                No
              </TableHead>
              <TableHead className="w-44 text-xs font-bold text-primary">
                Waktu Presensi (WIB)
              </TableHead>
              <TableHead className="w-32 text-xs font-bold text-primary">
                Sesi
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Nama Tamu
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Perwakilan Daerah
              </TableHead>
              <TableHead className="w-36 text-center text-xs font-bold text-primary">
                Status
              </TableHead>
              <TableHead className="w-16 text-center text-xs font-bold text-primary">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-36 text-center text-xs text-ink-muted py-8"
                >
                  <Clock className="w-8 h-8 text-ink-muted/40 mx-auto mb-2" />
                  Belum ada catatan presensi yang cocok dengan kriteria filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendances.map((item, idx) => {
                const sessionName =
                  sessionNameMap.get(item.session_id) || `Sesi ${item.session_id}`;
                const wibTime = formatToWibDateTime(item.checked_in_at);

                return (
                  <TableRow
                    key={item.id}
                    className="border-line hover:bg-surface/60 transition-colors"
                  >
                    <TableCell className="text-center text-xs text-ink-muted font-medium">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted font-mono">
                      {wibTime}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-primary">
                      {sessionName}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">
                      {item.nama}
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {item.perwakilan_daerah}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_walk_in ? (
                        <Badge className="bg-gold-100 text-brand-gold-text border-gold-300 text-[11px] font-semibold hover:bg-gold-100">
                          Tamu Baru
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-brand-green-deep border-green-300 text-[11px] font-semibold hover:bg-green-100">
                          Terdaftar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDelete(item)}
                        className="w-8 h-8 text-ink-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus entri absensi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Konfirmasi Hapus Kehadiran (FR-18) */}
      <Dialog
        open={Boolean(selectedDelete)}
        onOpenChange={(open) => !open && setSelectedDelete(null)}
      >
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-danger flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-danger" />
              Hapus Catatan Kehadiran?
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan presensi untuk{" "}
              <strong className="text-primary font-semibold">
                {selectedDelete?.nama}
              </strong>{" "}
              di sesi{" "}
              <strong className="text-primary font-semibold">
                {sessionNameMap.get(selectedDelete?.session_id || 0) ||
                  `Sesi ${selectedDelete?.session_id}`}
              </strong>
              ? Peserta ini akan dapat melakukan presensi ulang jika diperlukan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedDelete(null)}
              disabled={isDeleting}
              className="rounded-xl border-line text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-danger hover:bg-red-700 text-white text-xs font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Kehadiran"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
