"use client";

import { useState, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { formatToWibDateTime, type SessionInfo } from "@/lib/csv";
import { filterAttendances } from "@/lib/attendance-export";
import { RekapMenubar } from "@/components/admin/rekap-menubar";
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

const dayFilterItems = [
  { value: "all", label: "Semua Hari" },
  { value: "1", label: "Hari Pertama" },
  { value: "2", label: "Hari Kedua" },
  { value: "3", label: "Hari Ketiga" },
];

const filterTriggerClassName = "w-full min-w-0 gap-2 rounded-xl border-line text-base lg:text-sm data-[size=default]:h-11 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:block";

const filterContentProps = {
  side: "bottom",
  align: "start",
  sideOffset: 4,
  alignItemWithTrigger: false,
  collisionAvoidance: { side: "none", align: "none", fallbackAxisSide: "none" },
} as const;

// Gaya dropdown filter yang seragam (Hari, Sesi, Daerah)
const filterContentClassName =
  "w-(--anchor-width) min-w-0 rounded-xl border border-line bg-popover p-1.5 shadow-lg ring-0 [&_[data-slot=select-scroll-up-button]]:rounded-t-lg [&_[data-slot=select-scroll-down-button]]:rounded-b-lg";
const filterGroupClassName = "p-0";
const filterItemClassName =
  "min-h-10 rounded-lg py-2 pr-9 pl-3 text-sm text-ink focus:bg-secondary focus:text-primary data-highlighted:bg-secondary data-highlighted:text-primary data-[selected]:font-semibold data-[selected]:text-primary [&_svg]:text-brand-green-text *:[span]:first:min-w-0 *:[span]:first:truncate *:[span]:first:block";
const filterNestedItemClassName = `${filterItemClassName} pl-5`;
const filterLabelClassName =
  "px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted";
const filterSeparatorClassName = "mx-1 my-1.5 bg-line";

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

  const selectedDayLabel = dayFilterItems.find((item) => item.value === selectedDay)?.label ?? "Semua Hari";
  const allSessionsLabel = selectedDay === "all" ? "Semua Sesi" : `Semua Sesi ${selectedDayLabel}`;
  const sessionFilterItems = [
    { value: "all", label: allSessionsLabel },
    ...availableSessions.map((session) => ({
      value: String(session.id),
      label: `Sesi ${((session.id - 1) % 3) + 1}: ${session.nama}`,
    })),
  ];
  const daerahFilterItems = [
    { value: "all", label: "Semua Daerah" },
    ...uniqueDaerahList.map((daerah) => ({ value: daerah, label: daerah })),
  ];
  const selectedSessionLabel = sessionFilterItems.find((item) => item.value === selectedSessionId)?.label ?? allSessionsLabel;
  const selectedDaerahLabel = daerahFilterItems.find((item) => item.value === selectedDaerah)?.label ?? "Semua Daerah";

  // Filter attendances (semantik sama dengan ekspor Excel "sesuai filter")
  const filteredAttendances = useMemo(
    () =>
      filterAttendances(attendances, sessions, {
        hari: selectedDay === "all" ? null : Number(selectedDay),
        sessionId: selectedSessionId === "all" ? null : Number(selectedSessionId),
        daerah: selectedDaerah === "all" ? null : selectedDaerah,
        q: search,
      }),
    [attendances, sessions, selectedDay, selectedSessionId, selectedDaerah, search]
  );

  // Metrik statistik
  const metrics = useMemo(() => {
    const total = filteredAttendances.length;
    const registered = filteredAttendances.filter((a) => !a.is_walk_in).length;
    const walkIn = filteredAttendances.filter((a) => a.is_walk_in).length;

    return { total, registered, walkIn };
  }, [filteredAttendances]);

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
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
            <CheckCircle className="w-5 h-5 text-brand-green-text" />
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
            <UserPlus className="w-5 h-5 text-brand-gold-text" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-brand-gold-text">
              {metrics.walkIn}
            </div>
            <div className="text-xs text-ink-muted">Tamu Baru (Walk-in)</div>
          </div>
        </div>
      </div>

      {/* Menubar Ekspor Excel & Hapus Data */}
      <RekapMenubar
        sessions={sessions}
        filter={{ day: selectedDay, sessionId: selectedSessionId, daerah: selectedDaerah, search }}
        filteredCount={filteredAttendances.length}
      />

      {/* Kontrol Filter */}
      <div role="group" aria-label="Filter rekap kehadiran" className="space-y-4 bg-white p-4 rounded-2xl border border-line shadow-2xs">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* Filter Hari */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="rekap-filter-hari" className="text-sm text-ink">Hari</Label>
            <Select
              items={dayFilterItems}
              value={selectedDay}
              onValueChange={(val) => {
                setSelectedDay(val ?? "all");
                setSelectedSessionId("all");
              }}
            >
              <SelectTrigger id="rekap-filter-hari" title={selectedDayLabel} className={filterTriggerClassName}>
                <Calendar className="size-4 text-brand-green-text" aria-hidden="true" />
                <SelectValue className="truncate" placeholder="Semua Hari" />
              </SelectTrigger>
              <SelectContent {...filterContentProps} className={`${filterContentClassName} max-h-[min(18rem,var(--available-height))]`}>
                <SelectGroup className={filterGroupClassName}>
                  {dayFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className={filterItemClassName}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Sesi */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="rekap-filter-sesi" className="text-sm text-ink">Sesi</Label>
            <Select
              items={sessionFilterItems}
              value={selectedSessionId}
              onValueChange={(val) => setSelectedSessionId(val ?? "all")}
            >
              <SelectTrigger id="rekap-filter-sesi" title={selectedSessionLabel} className={filterTriggerClassName}>
                <Clock className="size-4 text-brand-gold-text" aria-hidden="true" />
                <SelectValue className="truncate" placeholder="Semua Sesi" />
              </SelectTrigger>
              <SelectContent {...filterContentProps} className={`${filterContentClassName} max-h-[min(22rem,var(--available-height))]`}>
                <SelectGroup className={filterGroupClassName}>
                  <SelectItem value="all" className={filterItemClassName}>
                    {selectedDay === "all" ? `Semua Sesi (${sessions.length} Sesi)` : allSessionsLabel}
                  </SelectItem>
                </SelectGroup>
                {(selectedDay === "all" ? [1, 2, 3] : [Number(selectedDay)]).map((dayNum) => {
                  const daySessions = sessions.filter(
                    (s) => (s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3)) === dayNum
                  );
                  if (daySessions.length === 0) return null;
                  const dayTitle =
                    dayFilterItems.find((item) => item.value === String(dayNum))?.label ?? `Hari ${dayNum}`;

                  return (
                    <SelectGroup key={`group-day-${dayNum}`} className={filterGroupClassName}>
                      <SelectSeparator className={filterSeparatorClassName} />
                      <SelectLabel className={filterLabelClassName}>{dayTitle}</SelectLabel>
                      {daySessions.map((s) => {
                        const label = `Sesi ${((s.id - 1) % 3) + 1}: ${s.nama}`;
                        return (
                          <SelectItem key={s.id} value={String(s.id)} title={label} className={filterNestedItemClassName}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Daerah */}
          <div className="min-w-0 space-y-2">
            <Label htmlFor="rekap-filter-daerah" className="text-sm text-ink">Daerah</Label>
            <Select
              items={daerahFilterItems}
              value={selectedDaerah}
              onValueChange={(val) => setSelectedDaerah(val ?? "all")}
            >
              <SelectTrigger id="rekap-filter-daerah" title={selectedDaerahLabel} className={filterTriggerClassName}>
                <MapPin className="size-4 text-brand-gold-text" aria-hidden="true" />
                <SelectValue className="truncate" placeholder="Semua Daerah" />
              </SelectTrigger>
              <SelectContent {...filterContentProps} className={`${filterContentClassName} max-h-[min(20rem,var(--available-height))]`}>
                <SelectGroup className={filterGroupClassName}>
                  <SelectItem value="all" className={filterItemClassName}>
                    Semua Daerah ({uniqueDaerahList.length})
                  </SelectItem>
                </SelectGroup>
                {uniqueDaerahList.length > 0 && (
                  <SelectGroup className={filterGroupClassName}>
                    <SelectSeparator className={filterSeparatorClassName} />
                    {uniqueDaerahList.map((daerah) => (
                      <SelectItem key={daerah} value={daerah} title={daerah} className={filterItemClassName}>
                        {daerah}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="rekap-filter-search" className="text-sm text-ink">Pencarian</Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted" aria-hidden="true" />
              <Input
                id="rekap-filter-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, daerah, jabatan, atau departemen..."
                className="h-11 pl-10 rounded-xl border-line text-base lg:text-sm focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-brand-green-text border border-brand-green/30">
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
                        <Badge className="bg-green-100 text-brand-green-deep border-brand-green/30 text-[10px] font-semibold hover:bg-green-100">
                          Terdaftar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rank === "first" ? (
                        <Badge className="bg-gold-100 text-brand-gold-text border-brand-gold/40 text-[10px] font-bold hover:bg-gold-100 inline-flex items-center gap-1">
                          <Award className="w-3 h-3 text-brand-gold-text" />
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
