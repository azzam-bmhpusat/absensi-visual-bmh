"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, FileSpreadsheet, Filter, Layers, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  countAttendancesAction,
  deleteAllAttendancesAction,
  deleteSessionAttendancesAction,
  type AttendanceCountResult,
} from "@/app/admin/actions";
import { sessionLabel, type ExportSession } from "@/lib/attendance-export";
import { DeleteAttendancesDialog, type DeleteTarget } from "@/components/admin/delete-attendances-dialog";

export const EXPORT_ENDPOINT = "/api/admin/rekap-kehadiran/export";

export interface RekapFilterState {
  day: string;
  sessionId: string;
  daerah: string;
  search: string;
}

interface RekapMenubarProps {
  sessions: ExportSession[];
  filter: RekapFilterState;
  filteredCount: number;
  onDeleted?: (target: DeleteTarget) => void;
}

/** Bangun URL endpoint ekspor Excel sesuai mode. */
export function buildExportUrl(
  mode: "all" | "session" | "filter",
  filter: RekapFilterState
): string {
  const params = new URLSearchParams({ mode });
  if (mode === "session") params.set("sesi", filter.sessionId);
  if (mode === "filter") {
    if (filter.day !== "all") params.set("hari", filter.day);
    if (filter.sessionId !== "all") params.set("sesi", filter.sessionId);
    if (filter.daerah !== "all") params.set("daerah", filter.daerah);
    if (filter.search.trim()) params.set("q", filter.search.trim());
  }
  return `${EXPORT_ENDPOINT}?${params.toString()}`;
}

function filenameFromDisposition(header: string | null): string | null {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

const triggerClassName =
  "h-10 gap-1.5 rounded-xl border-line bg-white px-3 text-sm font-semibold text-primary shadow-2xs hover:bg-secondary data-popup-open:bg-secondary";
const itemClassName = "min-h-9 cursor-pointer rounded-lg px-2.5 py-2 text-sm";

export function RekapMenubar({ sessions, filter, filteredCount, onDeleted }: RekapMenubarProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const [counts, setCounts] = useState<AttendanceCountResult | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [isCounting, startCounting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const selectedSession =
    filter.sessionId !== "all" ? sessions.find((s) => String(s.id) === filter.sessionId) ?? null : null;

  const runExport = async (mode: "all" | "session" | "filter", label: string) => {
    if (exporting) return;
    setExporting(mode);
    try {
      const res = await fetch(buildExportUrl(mode, filter), { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Gagal mengekspor (HTTP ${res.status}).`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromDisposition(res.headers.get("Content-Disposition")) ?? "rekap-kehadiran-bmh.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Excel ${label} berhasil diunduh.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengekspor Excel.");
    } finally {
      setExporting(null);
    }
  };

  const openDelete = (next: DeleteTarget) => {
    setTarget(next);
    setDialogKey((k) => k + 1);
    setCounts(null);
    setCountError(null);
    startCounting(async () => {
      const res = await countAttendancesAction(next.kind === "all" ? "all" : next.session.id);
      if (res.success && res.data) setCounts(res.data);
      else setCountError(res.error || "Gagal menghitung data kehadiran.");
    });
  };

  const confirmDelete = (confirmText: string) => {
    if (!target) return;
    const current = target;
    startDeleting(async () => {
      const res =
        current.kind === "all"
          ? await deleteAllAttendancesAction(confirmText)
          : await deleteSessionAttendancesAction(current.session.id);
      if (res.success) {
        const n = res.data?.deletedCount ?? 0;
        toast.success(
          current.kind === "all"
            ? `${n} data kehadiran di semua sesi berhasil dihapus.`
            : `${n} data kehadiran ${sessionLabel(current.session)} berhasil dihapus.`
        );
        setTarget(null);
        onDeleted?.(current);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus data kehadiran.");
      }
    });
  };

  const exportForTarget = () => {
    if (!target) return;
    if (target.kind === "all") void runExport("all", "semua sesi");
    else void runExport("session", sessionLabel(target.session));
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="Menu ekspor dan hapus rekap kehadiran"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-2xs"
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className={triggerClassName} />}
            disabled={Boolean(exporting)}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="size-4 text-brand-green" aria-hidden="true" />
            )}
            Ekspor Excel
            <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 rounded-xl border border-line p-1.5 shadow-lg">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Ekspor ke Excel (.xlsx)</DropdownMenuLabel>
              <DropdownMenuItem
                className={itemClassName}
                disabled={!selectedSession}
                onClick={() => selectedSession && runExport("session", sessionLabel(selectedSession))}
              >
                <FileSpreadsheet className="text-brand-green" aria-hidden="true" />
                <span className="flex flex-col">
                  <span>Sesi terpilih</span>
                  <span className="text-xs text-ink-muted">
                    {selectedSession ? sessionLabel(selectedSession) : "Pilih sesi di filter Sesi dulu"}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className={itemClassName} onClick={() => runExport("all", "semua sesi")}>
                <Layers className="text-brand-green" aria-hidden="true" />
                <span className="flex flex-col">
                  <span>Semua sesi</span>
                  <span className="text-xs text-ink-muted">Ringkasan, 1 sheet per sesi, matriks undangan</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClassName}
                disabled={filteredCount === 0}
                onClick={() => runExport("filter", "sesuai filter")}
              >
                <Filter className="text-brand-green" aria-hidden="true" />
                <span className="flex flex-col">
                  <span>Sesuai filter saat ini</span>
                  <span className="text-xs text-ink-muted">{filteredCount} baris yang tampil di tabel</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className={`${triggerClassName} text-danger hover:text-danger hover:bg-red-50 data-popup-open:bg-red-50`}
              />
            }
            disabled={isDeleting}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Hapus Data
            <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 rounded-xl border border-line p-1.5 shadow-lg">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Hapus data kehadiran (permanen)</DropdownMenuLabel>
              <DropdownMenuItem
                variant="destructive"
                className={itemClassName}
                disabled={!selectedSession}
                onClick={() => selectedSession && openDelete({ kind: "session", session: selectedSession })}
              >
                <Trash2 aria-hidden="true" />
                <span className="flex flex-col">
                  <span>Hapus sesi terpilih…</span>
                  <span className="text-xs text-ink-muted">
                    {selectedSession ? sessionLabel(selectedSession) : "Pilih sesi di filter Sesi dulu"}
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className={itemClassName} onClick={() => openDelete({ kind: "all" })}>
              <Trash2 aria-hidden="true" />
              <span>Hapus SEMUA sesi…</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteAttendancesDialog
        key={dialogKey}
        target={target}
        sessions={sessions}
        counts={counts}
        countError={countError}
        isCounting={isCounting}
        isDeleting={isDeleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
        onExportFirst={exportForTarget}
      />
    </>
  );
}
