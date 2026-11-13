"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AttendanceDialogProps {
  sessionId: 1 | 2;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({
  sessionId,
  open,
  onOpenChange,
}: AttendanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div>
            <Badge variant="outline" className="bg-gold-50 text-brand-gold-text border-brand-gold-soft">
              {sessionId === 1 ? "Hari Pertama" : "Hari Kedua"}
            </Badge>
          </div>
          <DialogTitle className="font-heading text-xl text-primary">
            Konfirmasi Kehadiran
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink-muted">
          Formulir absensi akan disempurnakan pada Fase 2.
        </p>
      </DialogContent>
    </Dialog>
  );
}
