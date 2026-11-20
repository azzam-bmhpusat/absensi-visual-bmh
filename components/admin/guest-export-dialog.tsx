"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportGuestsPdf,
  filterGuestsByMode,
  GUEST_MODE_FILTER_LABEL,
  type GuestModeFilter,
  type GuestPdfRow,
} from "@/lib/guest-pdf";

interface GuestExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: GuestPdfRow[];
}

const MODES = Object.keys(GUEST_MODE_FILTER_LABEL) as GuestModeFilter[];

export function GuestExportDialog({ open, onOpenChange, guests }: GuestExportDialogProps) {
  const [mode, setMode] = useState<GuestModeFilter>("all");
  const [isExporting, setIsExporting] = useState(false);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        MODES.map((m) => [m, filterGuestsByMode(guests, m).length])
      ) as Record<GuestModeFilter, number>,
    [guests]
  );

  const handleExport = async () => {
    const rows = filterGuestsByMode(guests, mode);
    if (rows.length === 0) {
      toast.error(`Tidak ada tamu dengan kehadiran ${GUEST_MODE_FILTER_LABEL[mode]}.`);
      return;
    }
    setIsExporting(true);
    try {
      await exportGuestsPdf(rows, { mode: mode === "all" ? undefined : mode });
      toast.success("PDF berhasil dibuat.");
      onOpenChange(false);
    } catch (err) {
      console.error("Export PDF tamu gagal:", err);
      toast.error("Gagal membuat PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isExporting && onOpenChange(next)}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg font-bold text-primary">
            <FileDown className="h-5 w-5 text-brand-green-text" />
            Export PDF Tamu Undangan
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Pilih filter terlebih dahulu, lalu export daftar tamu ke PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 pt-2">
          <Label htmlFor="guest-export-mode" className="text-xs font-semibold text-primary">
            Kehadiran
          </Label>
          <Select
            value={mode}
            onValueChange={(v) => v && setMode(v as GuestModeFilter)}
            disabled={isExporting}
          >
            <SelectTrigger
              id="guest-export-mode"
              className="h-10 w-full rounded-xl border-line bg-white text-xs"
            >
              <SelectValue>
                {(value: GuestModeFilter) =>
                  `${GUEST_MODE_FILTER_LABEL[value ?? "all"]} (${counts[value ?? "all"]})`
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {MODES.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {GUEST_MODE_FILTER_LABEL[m]} ({counts[m]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-ink-muted">
            <strong>{counts[mode]}</strong> tamu akan diexport.
          </p>
        </div>

        <DialogFooter className="mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="rounded-xl border-line text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl bg-primary text-xs font-semibold text-white shadow-xs hover:bg-brand-green-deep"
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="mr-1.5 h-3.5 w-3.5 text-brand-gold-soft" />
            )}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
