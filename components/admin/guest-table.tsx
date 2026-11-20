"use client";

import { useState, useMemo, useTransition } from "react";
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
  Search,
  FileDown,
  Trash2,
  Users,
  MapPin,
  Loader2,
  UserPlus,
  Pencil,
} from "lucide-react";
import { GuestFormDialog } from "./guest-form-dialog";
import { GuestExportDialog } from "./guest-export-dialog";
import { deleteGuestAction } from "@/app/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface GuestItem {
  id: string;
  nama: string;
  perwakilan_daerah: string;
  jabatan?: string | null;
  departemen?: string | null;
  kategori?: string | null;
  ukuran_baju?: string | null;
  mode_kehadiran?: string | null;
  created_at?: string;
}

interface GuestTableProps {
  initialGuests: GuestItem[];
}

export function GuestTable({ initialGuests }: GuestTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedDeleteGuest, setSelectedDeleteGuest] = useState<GuestItem | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredGuests = useMemo(() => {
    if (!search.trim()) return initialGuests;
    const q = search.toLowerCase();
    return initialGuests.filter(
      (g) =>
        g.nama.toLowerCase().includes(q) ||
        g.perwakilan_daerah.toLowerCase().includes(q) ||
        (g.jabatan && g.jabatan.toLowerCase().includes(q)) ||
        (g.departemen && g.departemen.toLowerCase().includes(q))
    );
  }, [initialGuests, search]);

  const handleConfirmDelete = () => {
    if (!selectedDeleteGuest) return;

    startDeleteTransition(async () => {
      const res = await deleteGuestAction(selectedDeleteGuest.id);
      if (res.success) {
        toast.success(`Data tamu "${selectedDeleteGuest.nama}" berhasil dihapus.`);
        setSelectedDeleteGuest(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus data tamu.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Baris Kontrol: Pencarian & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tamu atau daerah..."
            className="pl-9 h-10 rounded-xl border-line text-xs focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-primary hover:bg-brand-green-deep text-white text-xs font-semibold shadow-xs"
          >
            <UserPlus className="w-4 h-4 mr-1.5 text-brand-gold-soft" />
            Tambah Tamu
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsExportOpen(true)}
            className="h-10 px-3.5 rounded-xl border-line text-primary hover:border-ring text-xs font-semibold shadow-2xs"
          >
            <FileDown className="w-4 h-4 mr-1.5 text-brand-gold-text" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Baris Informasi Jumlah */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-brand-green-text" />
          <span>
            Total: <strong>{initialGuests.length}</strong> tamu terdaftar
          </span>
          {search && (
            <span>
              (menampilkan <strong>{filteredGuests.length}</strong> hasil)
            </span>
          )}
        </div>
      </div>

      {/* Tabel Data Tamu */}
      <div className="border border-line rounded-2xl overflow-hidden bg-white shadow-2xs">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-line hover:bg-muted">
              <TableHead className="w-14 text-center text-xs font-bold text-primary">
                No
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Nama Tamu Undangan
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Perwakilan / Asal
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Jabatan / Departemen
              </TableHead>
              <TableHead className="text-xs font-bold text-primary">
                Ukuran / Kehadiran
              </TableHead>
              <TableHead className="w-24 text-center text-xs font-bold text-primary">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-36 text-center text-xs text-ink-muted py-8"
                >
                  <Users className="w-8 h-8 text-ink-muted/40 mx-auto mb-2" />
                  {search
                    ? "Tidak ada tamu yang cocok dengan kata kunci pencarian."
                    : "Belum ada daftar tamu undangan yang diimpor. Gunakan tombol 'Import CSV Tamu'."}
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests.map((guest, idx) => (
                <TableRow
                  key={guest.id}
                  className="border-line hover:bg-surface/60 transition-colors"
                >
                  <TableCell className="text-center text-xs text-ink-muted font-medium">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-primary">
                    {guest.nama}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-gold-text" />
                      {guest.perwakilan_daerah}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {guest.jabatan || guest.departemen ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-brand-green-text border border-brand-green/30">
                        {guest.jabatan}
                        {guest.departemen ? `: ${guest.departemen}` : ""}
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-muted/60">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {guest.ukuran_baju || guest.mode_kehadiran ? (
                      <span>
                        {guest.ukuran_baju ?? "-"}
                        {" / "}
                        {guest.mode_kehadiran === "online"
                          ? "Online"
                          : guest.mode_kehadiran === "offline"
                            ? "Offline"
                            : "-"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-muted/60">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingGuest(guest)}
                        className="w-8 h-8 text-ink-muted hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                        title="Edit data tamu"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDeleteGuest(guest)}
                        className="w-8 h-8 text-ink-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus data tamu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Konfirmasi Hapus Tamu */}
      <Dialog
        open={Boolean(selectedDeleteGuest)}
        onOpenChange={(open) => !open && setSelectedDeleteGuest(null)}
      >
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-danger flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-danger" />
              Hapus Data Tamu Undangan?
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted leading-relaxed">
              Apakah Anda yakin ingin menghapus{" "}
              <strong className="text-primary font-semibold">
                {selectedDeleteGuest?.nama}
              </strong>{" "}
              ({selectedDeleteGuest?.perwakilan_daerah}) dari daftar tamu? Data
              kehadiran yang telah tercatat tidak akan terhapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedDeleteGuest(null)}
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
                "Hapus Tamu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Filter & Export PDF */}
      <GuestExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        guests={initialGuests}
      />
      {/* Dialog Form Tambah / Edit Tamu */}
      <GuestFormDialog
        open={isAddOpen || Boolean(editingGuest)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingGuest(null);
          }
        }}
        guest={editingGuest}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
