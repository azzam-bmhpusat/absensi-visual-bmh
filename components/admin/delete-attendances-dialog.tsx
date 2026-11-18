"use client";

import { useState } from "react";
import { AlertTriangle, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DELETE_ALL_CONFIRM_PHRASE,
  sessionLabel,
  type ExportSession,
} from "@/lib/attendance-export";
import type { AttendanceCountResult } from "@/app/admin/actions";

export type DeleteTarget = { kind: "session"; session: ExportSession } | { kind: "all" };

interface DeleteAttendancesDialogProps {
  target: DeleteTarget | null;
  sessions: ExportSession[];
  counts: AttendanceCountResult | null;
  countError: string | null;
  isCounting: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (confirmText: string) => void;
  onExportFirst: () => void;
}

export function DeleteAttendancesDialog({
  target,
  sessions,
  counts,
  countError,
  isCounting,
  isDeleting,
  onCancel,
  onConfirm,
  onExportFirst,
}: DeleteAttendancesDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isAll = target?.kind === "all";
  const total = counts?.total ?? 0;
  const phraseOk = !isAll || confirmText.trim() === DELETE_ALL_CONFIRM_PHRASE;
  const canDelete = Boolean(target) && !isCounting && !countError && total > 0 && phraseOk && !isDeleting;
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const close = () => {
    if (isDeleting) return;
    setConfirmText("");
    onCancel();
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-danger flex items-center gap-2">
            <Trash2 className="size-5 text-danger" aria-hidden="true" />
            {isAll ? "Hapus SEMUA Data Kehadiran?" : "Hapus Data Kehadiran Sesi?"}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-muted leading-relaxed">
            {isCounting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Menghitung data kehadiran…
              </span>
            ) : countError ? (
              <span className="text-danger">{countError}</span>
            ) : target?.kind === "session" ? (
              <>
                Anda akan menghapus{" "}
                <strong className="text-danger">{total} data kehadiran</strong> pada{" "}
                <strong className="text-primary">{sessionLabel(target.session)}</strong>.
              </>
            ) : (
              <>
                Anda akan menghapus{" "}
                <strong className="text-danger">{total} data kehadiran</strong> dari{" "}
                <strong className="text-primary">semua {counts?.perSession.length ?? sessions.length} sesi</strong>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isAll && counts && !isCounting && !countError && (
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-line divide-y divide-line text-xs">
            {counts.perSession.map(({ session_id, count }) => {
              const s = sessionMap.get(session_id);
              return (
                <li key={session_id} className="flex justify-between gap-3 px-3 py-1.5">
                  <span className="text-ink">{s ? sessionLabel(s) : `Sesi ${session_id}`}</span>
                  <span className="font-semibold text-primary tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden="true" />
          <p>
            Tindakan ini <strong>permanen dan tidak bisa dibatalkan</strong>. Daftar tamu undangan tidak ikut
            terhapus. Sebaiknya ekspor Excel terlebih dahulu sebagai cadangan.
          </p>
        </div>

        {isAll && (
          <div className="space-y-2">
            <Label htmlFor="hapus-semua-konfirmasi" className="text-xs text-ink">
              Ketik <strong className="font-mono text-danger">{DELETE_ALL_CONFIRM_PHRASE}</strong> untuk melanjutkan
            </Label>
            <Input
              id="hapus-semua-konfirmasi"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              disabled={isDeleting}
              className="h-10 rounded-xl border-line font-mono"
            />
          </div>
        )}

        <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={onExportFirst}
            disabled={isDeleting}
            className="rounded-xl border-line text-xs"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Ekspor Excel dulu
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={close} disabled={isDeleting} className="rounded-xl border-line text-xs">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => onConfirm(confirmText)}
              disabled={!canDelete}
              className="rounded-xl bg-danger hover:bg-red-700 text-white text-xs font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Menghapus…
                </>
              ) : (
                `Hapus ${total} Data`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
