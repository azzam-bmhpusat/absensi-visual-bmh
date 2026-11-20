"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  Search,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  approveRegistrationAction,
  deleteRegistrationAction,
  rejectRegistrationAction,
} from "@/app/(admin)/approval/actions";
import {
  MODE_KEHADIRAN_LABEL,
  REGISTRATION_STATUS_LABEL,
} from "@/lib/registration-schema";
import { formatRegistrationDate, type RegistrationRow } from "@/lib/registration-row";

type StatusFilter = "all" | RegistrationRow["status"];

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "all", label: "Semua" },
];

const STATUS_STYLE: Record<RegistrationRow["status"], string> = {
  pending: "bg-gold-100 text-brand-gold-text border-brand-gold/40",
  approved: "bg-emerald-50 text-brand-green-deep border-emerald-200",
  rejected: "bg-red-50 text-danger border-red-200",
};

interface ApprovalTableProps {
  registrations: RegistrationRow[];
}

export function ApprovalTable({ registrations }: ApprovalTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<RegistrationRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const r of registrations) c[r.status] += 1;
    return c;
  }, [registrations]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.nama.toLowerCase().includes(q) ||
        r.perwakilan_bmh.toLowerCase().includes(q) ||
        r.jabatan.toLowerCase().includes(q) ||
        (r.departemen ?? "").toLowerCase().includes(q)
      );
    });
  }, [registrations, filter, search]);

  const run = (
    id: string,
    action: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>,
    onDone?: () => void
  ) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await action(id);
      setBusyId(null);
      if (res.success) {
        toast.success(res.message ?? "Berhasil.");
        onDone?.();
        router.refresh();
      } else {
        toast.error(res.error ?? "Terjadi kesalahan.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, perwakilan, atau jabatan..."
            className="h-10 rounded-xl border-line pl-9 text-xs focus-visible:ring-brand-green"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status">
        {FILTERS.map((f) => {
          const count =
            f.value === "all" ? registrations.length : counts[f.value];
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-ink-muted hover:border-brand-green"
              )}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-2xs">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-line hover:bg-muted">
              <TableHead className="w-12 text-center text-xs font-bold text-primary">No</TableHead>
              <TableHead className="text-xs font-bold text-primary">Nama</TableHead>
              <TableHead className="text-xs font-bold text-primary">Perwakilan BMH</TableHead>
              <TableHead className="text-xs font-bold text-primary">Jabatan / Departemen</TableHead>
              <TableHead className="text-center text-xs font-bold text-primary">Ukuran</TableHead>
              <TableHead className="text-xs font-bold text-primary">Kehadiran</TableHead>
              <TableHead className="text-xs font-bold text-primary">Status</TableHead>
              <TableHead className="text-xs font-bold text-primary">Tanggal</TableHead>
              <TableHead className="w-36 text-center text-xs font-bold text-primary">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-36 py-8 text-center text-xs text-ink-muted">
                  <UserCheck className="mx-auto mb-2 h-8 w-8 text-ink-muted/40" />
                  Tidak ada pendaftaran pada filter ini.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r, idx) => {
                const busy = busyId === r.id && isPending;
                return (
                  <TableRow key={r.id} className="border-line transition-colors hover:bg-surface/60">
                    <TableCell className="text-center text-xs font-medium text-ink-muted">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">{r.nama}</TableCell>
                    <TableCell className="text-xs text-ink-muted">{r.perwakilan_bmh}</TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {r.jabatan}
                      {r.departemen ? ` / ${r.departemen}` : ""}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold text-primary">
                      {r.ukuran_baju}
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {MODE_KEHADIRAN_LABEL[r.mode_kehadiran]}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          STATUS_STYLE[r.status]
                        )}
                      >
                        {REGISTRATION_STATUS_LABEL[r.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-ink-muted">
                      {formatRegistrationDate(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {r.status !== "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={busy}
                            onClick={() => run(r.id, approveRegistrationAction)}
                            className="h-8 w-8 rounded-lg text-brand-green hover:bg-emerald-50"
                            title="Setujui"
                            aria-label={`Setujui ${r.nama}`}
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                        )}
                        {r.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={busy}
                            onClick={() => run(r.id, rejectRegistrationAction)}
                            className="h-8 w-8 rounded-lg text-brand-gold-text hover:bg-gold-100"
                            title="Tolak"
                            aria-label={`Tolak ${r.nama}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busy}
                          onClick={() => setToDelete(r)}
                          className="h-8 w-8 rounded-lg text-ink-muted hover:bg-red-50 hover:text-danger"
                          title="Hapus"
                          aria-label={`Hapus ${r.nama}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg font-bold text-danger">
              <Trash2 className="h-5 w-5" />
              Hapus Pendaftaran?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Pendaftaran{" "}
              <strong className="font-semibold text-primary">{toDelete?.nama}</strong> (
              {toDelete?.perwakilan_bmh}) akan dihapus permanen. Jika sudah disetujui, data
              di daftar tamu tidak ikut terhapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={isPending}
              className="rounded-xl border-line text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                toDelete && run(toDelete.id, deleteRegistrationAction, () => setToDelete(null))
              }
              className="rounded-xl bg-danger text-xs font-semibold text-white hover:bg-red-700"
            >
              {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
