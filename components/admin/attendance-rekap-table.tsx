"use client";

import { useState, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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
  Award,
  AlertCircle,
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
  jabatan?: string | null;
  departemen?: string | null;
  kategori?: string | null;
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
  const [selectedDay, setSelectedDay] = useState<string>("all");
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

  // Sesi map untuk lookup cepat nama sesi dan hari
  const sessionInfoMap = useMemo(() => {
    return new Map<number, { nama: string; hari: number }>(
      sessions.map((s) => [
        s.id,
        {
          nama: s.nama,
          hari: s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3),
        },
      ])
    );
  }, [sessions]);

  // Hitung peringkat (rank) per sesi:
  // Urutkan per sesi dari yang tercepat (checked_in_at ascending).
  // 3 orang pertama dapat label "first" (🏅 3 Pertama).
  // 5 orang terakhir dapat label "last" (⏰ 5 Terakhir) - hanya jika belum masuk 3 pertama.
  const rankByAttendanceId = useMemo(() => {
    const result = new Map<string, "first" | "last">();

    // Kelompokkan kehadiran per session_id
    const grouped = new Map<number, AttendanceItem[]>();
    attendances.forEach((a) => {
      const list = grouped.get(a.session_id) || [];
      list.push(a);
      grouped.set(a.session_id, list);
    });

    grouped.forEach((sessionItems) => {
      // Urutkan dari yang pertama kali absen (earliest first)
      const sorted = [...sessionItems].sort(
        (a, b) =>
          new Date(a.checked_in_at).getTime() -
          new Date(b.checked_in_at).getTime()
      );

      const totalInSession = sorted.length;

      sorted.forEach((item, index) => {
        if (index < 3) {
          result.set(item.id, "first");
        } else if (index >= totalInSession - 5) {
          result.set(item.id, "last");
        }
      });
    });

    return result;
  }, [attendances]);

  // Sesi yang tersedia di dropdown sesi sesuai filter hari yang dipilih
  const availableSessions = useMemo(() => {
    if (selectedDay === "all") return sessions;
    const targetDay = Number(selectedDay);
    return sessions.filter(
      (s) => (s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3)) === targetDay
    );
  }, [sessions, selectedDay]);

  // Filter attendances
  const filteredAttendances = useMemo(() => {
    return attendances.filter((item) => {
      const info = sessionInfoMap.get(item.session_id);
      const sessionDay = info?.hari ?? (item.session_id <= 3 ? 1 : item.session_id <= 6 ? 2 : 3);

      // Filter hari
      if (selectedDay !== "all") {
        if (sessionDay !== Number(selectedDay)) return false;
      }

      // Filter sesi spesifik
      if (selectedSessionId !== "all") {
        if (item.session_id !== Number(selectedSessionId)) return false;
      }

      // Filter daerah
      if (selectedDaerah !== "all") {
        if (item.perwakilan_daerah !== selectedDaerah) return false;
      }

      // Filter pencarian nama / daerah / jabatan / departemen
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNama = item.nama.toLowerCase().includes(q);
        const matchDaerah = item.perwakilan_daerah.toLowerCase().includes(q);
        const matchJabatan = item.jabatan?.toLowerCase().includes(q);
        const matchDept = item.departemen?.toLowerCase().includes(q);
        if (!matchNama && !matchDaerah && !matchJabatan && !matchDept) return false;
      }

      return true;
    });
  }, [attendances, selectedDay, selectedSessionId, selectedDaerah, search, sessionInfoMap]);

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
          {/* Filter Hari */}
          <div className="w-44">
            <Select
              value={selectedDay}
              onValueChange={(val) => {
                setSelectedDay(val ?? "all");
                setSelectedSessionId("all");
              }}
            >
              <SelectTrigger className="h-9 rounded-xl border-line text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                <SelectValue placeholder="Semua Hari" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">
                  Semua Hari
                </SelectItem>
                <SelectItem value="1" className="text-xs">
                  Hari Pertama
                </SelectItem>
                <SelectItem value="2" className="text-xs">
                  Hari Kedua
                </SelectItem>
                <SelectItem value="3" className="text-xs">
                  Hari Ketiga
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Sesi */}
          <div className="w-64">
            <Select
              value={selectedSessionId}
              onValueChange={(val) => setSelectedSessionId(val ?? "all")}
            >
              <SelectTrigger className="h-9 rounded-xl border-line text-xs">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-brand-gold-text" />
                <SelectValue placeholder="Pilih Sesi Acara" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-72">
                {selectedDay === "all" ? (
                  <>
                    <SelectItem value="all" className="text-xs font-medium">
                      Semua Sesi (9 Sesi)
                    </SelectItem>
                    <SelectSeparator className="my-1" />

                    {[1, 2, 3].map((dayNum) => {
                      const dayTitle =
                        dayNum === 1
                          ? "Hari Pertama"
                          : dayNum === 2
                          ? "Hari Kedua"
                          : "Hari Ketiga";
                      const daySessions = sessions.filter(
                        (s) => (s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3)) === dayNum
                      );

                      return (
                        <SelectGroup key={`group-day-${dayNum}`}>
                          <SelectLabel className="text-[11px] font-bold text-primary px-2 py-1">
                            {dayTitle}
                          </SelectLabel>
                          {daySessions.map((s) => {
                            const localOrder = ((s.id - 1) % 3) + 1;
                            return (
                              <SelectItem
                                key={s.id}
                                value={String(s.id)}
                                className="text-xs pl-4"
                              >
                                {`Sesi ${localOrder}: ${s.nama}`}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <SelectItem value="all" className="text-xs font-semibold">
                      {selectedDay === "1"
                        ? "Semua Sesi Hari Pertama"
                        : selectedDay === "2"
                        ? "Semua Sesi Hari Kedua"
                        : "Semua Sesi Hari Ketiga"}
                    </SelectItem>
                    <SelectSeparator className="my-1" />
                    <SelectGroup>
                      <SelectLabel className="text-[11px] font-bold text-primary px-2 py-1">
                        {selectedDay === "1"
                          ? "Hari Pertama:"
                          : selectedDay === "2"
                          ? "Hari Kedua:"
                          : "Hari Ketiga:"}
                      </SelectLabel>
                      {availableSessions.map((s) => {
                        const localOrder = ((s.id - 1) % 3) + 1;
                        return (
                          <SelectItem
                            key={s.id}
                            value={String(s.id)}
                            className="text-xs pl-3"
                          >
                            {`Sesi ${localOrder}: ${s.nama}`}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </>
                )}
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
              <TableHead className="w-40 text-xs font-bold text-primary">
                Waktu Presensi (WIB)
              </TableHead>
              <TableHead className="w-20 text-center text-xs font-bold text-primary">
                Hari
              </TableHead>
              <TableHead className="w-36 text-xs font-bold text-primary">
                Sesi Acara
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Nama Tamu
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Perwakilan / Asal
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Jabatan / Departemen
              </TableHead>
              <TableHead className="w-28 text-center text-xs font-bold text-primary">
                Status
              </TableHead>
              <TableHead className="w-28 text-center text-xs font-bold text-primary">
                Peringkat
              </TableHead>
              <TableHead className="w-14 text-center text-xs font-bold text-primary">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-36 text-center text-xs text-ink-muted py-8"
                >
                  <Clock className="w-8 h-8 text-ink-muted/40 mx-auto mb-2" />
                  Belum ada catatan presensi yang cocok dengan kriteria filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendances.map((item, idx) => {
                const sessionInfo = sessionInfoMap.get(item.session_id);
                const sessionName =
                  sessionInfo?.nama || `Sesi ${item.session_id}`;
                const sessionDay =
                  sessionInfo?.hari ?? (item.session_id <= 3 ? 1 : item.session_id <= 6 ? 2 : 3);
                const wibTime = formatToWibDateTime(item.checked_in_at);
                const rank = rankByAttendanceId.get(item.id);

                return (
                  <TableRow
                    key={item.id}
                    className="border-line hover:bg-surface/60 transition-colors"
                  >
                    <TableCell className="text-center text-xs text-ink-muted font-medium">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted font-mono whitespace-nowrap">
                      {wibTime}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold border-line bg-muted/60"
                      >
                        Hari {sessionDay}
                      </Badge>
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
                    <TableCell className="text-xs text-ink-muted">
                      {item.jabatan || item.departemen ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-brand-green border border-emerald-200">
                          {item.jabatan}
                          {item.departemen ? `: ${item.departemen}` : ""}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-muted/60">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_walk_in ? (
                        <Badge className="bg-gold-100 text-brand-gold-text border-gold-300 text-[10px] font-semibold hover:bg-gold-100">
                          Tamu Baru
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-brand-green-deep border-green-300 text-[10px] font-semibold hover:bg-green-100">
                          Terdaftar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rank === "first" ? (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold hover:bg-amber-100 inline-flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-600" />
                          3 Pertama
                        </Badge>
                      ) : rank === "last" ? (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold hover:bg-rose-100 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          5 Terakhir
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-ink-muted/50">-</span>
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
                {sessionInfoMap.get(selectedDelete?.session_id || 0)?.nama ||
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
