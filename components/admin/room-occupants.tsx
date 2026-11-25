"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, UserMinus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ContentManager, type ContentRowData } from "@/components/admin/content-manager";
import { saveHotelContact, setRoomOccupants } from "@/app/(admin)/kelola-konten/actions";
import type { FieldErrors } from "@/lib/content/schema";

export type PesertaOption = { id: string; nama: string; wilayah: string; roomId: number | null };
export type RoomData = ContentRowData & { nomor: string; kapasitas: number; penghuni: string[] };

/** Kelola kamar + penghuni (dipilih dari akun ber-role peserta). */
export function RoomManager({ rooms, peserta }: { rooms: RoomData[]; peserta: PesertaOption[] }) {
  const [editing, setEditing] = useState<RoomData | null>(null);
  return (
    <>
      <ContentManager
        kind="room"
        rows={rooms}
        renderActions={(row) => {
          const room = rooms.find((r) => r.id === row.id)!;
          return (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={() => setEditing(room)}>
              <Users className="size-3.5" aria-hidden="true" />
              Penghuni {room.penghuni.length}/{room.kapasitas}
            </Button>
          );
        }}
      />
      {editing && <OccupantsDialog key={editing.id} room={editing} peserta={peserta} onClose={() => setEditing(null)} />}
    </>
  );
}

function OccupantsDialog({ room, peserta, onClose }: { room: RoomData; peserta: PesertaOption[]; onClose: () => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(room.penghuni);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const byId = useMemo(() => new Map(peserta.map((p) => [p.id, p])), [peserta]);
  const full = selected.length >= room.kapasitas;

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return peserta
      .filter((p) => !selected.includes(p.id) && (p.roomId === null || p.roomId === room.id))
      .filter((p) => !q || p.nama.toLowerCase().includes(q) || p.wilayah.toLowerCase().includes(q))
      .slice(0, 50);
  }, [peserta, selected, query, room.id]);

  const save = () => startTransition(async () => {
    const res = await setRoomOccupants({ roomId: room.id, profileIds: selected });
    if (!res.success) return void toast.error(res.error);
    toast.success(`Penghuni kamar ${room.nomor} disimpan.`);
    onClose();
    router.refresh();
  });

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-primary">Penghuni kamar {room.nomor}</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Pilih dari akun ber-role peserta yang belum punya kamar. Kapasitas {room.kapasitas} orang.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {selected.length === 0 && <li className="text-sm text-ink-muted">Belum ada penghuni.</li>}
          {selected.map((id) => {
            const p = byId.get(id);
            return (
              <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
                <span className="min-w-0 text-sm">
                  <span className="font-medium text-ink">{p?.nama ?? "Peserta"}</span>
                  <span className="block text-xs text-ink-muted">{p?.wilayah ?? "-"}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-danger" onClick={() => setSelected((s) => s.filter((x) => x !== id))}>
                  <UserMinus className="size-3.5" aria-hidden="true" />
                  Lepas
                </Button>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2">
          <Label htmlFor="cari-peserta">Tambah penghuni</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <Input id="cari-peserta" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau wilayah peserta" className="h-11 rounded-xl pl-9" disabled={full} />
          </div>
          {full ? (
            <p className="text-xs text-ink-muted">Kamar sudah penuh. Lepas penghuni atau naikkan kapasitas kamar.</p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {options.length === 0 && <li className="py-2 text-sm text-ink-muted">Tidak ada peserta yang tersedia.</li>}
              {options.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                    onClick={() => { setSelected((s) => [...s, p.id]); setQuery(""); }}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-ink">{p.nama}</span>
                      <span className="block text-xs text-ink-muted">{p.wilayah}</span>
                    </span>
                    <UserPlus className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button type="button" className="h-11 gap-2 rounded-xl" onClick={save} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Simpan penghuni
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Kontak panitia akomodasi ("Ada kendala kamar? Hubungi …"). */
export function HotelContactForm({ initial }: { initial: { nama: string; whatsapp: string } | null }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveHotelContact(fd);
      if (!res.success) { setErrors(res.fieldErrors ?? {}); return void toast.error(res.error); }
      setErrors({});
      toast.success("Kontak akomodasi disimpan.");
      router.refresh();
    });
  };
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-primary">Kontak Akomodasi</h2>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="kontak-nama">Nama kontak</Label>
          <Input id="kontak-nama" name="nama" defaultValue={initial?.nama ?? ""} className="h-11 rounded-xl" aria-invalid={Boolean(errors.nama) || undefined} />
          {errors.nama && <p className="text-xs text-danger">{errors.nama}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kontak-wa">No WhatsApp</Label>
          <Input id="kontak-wa" name="whatsapp" inputMode="tel" defaultValue={initial?.whatsapp ?? ""} placeholder="6281234567890" className="h-11 rounded-xl" aria-invalid={Boolean(errors.whatsapp) || undefined} />
          {errors.whatsapp && <p className="text-xs text-danger">{errors.whatsapp}</p>}
        </div>
        <Button type="submit" className="h-11 gap-2 rounded-xl" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Simpan kontak
        </Button>
      </form>
    </section>
  );
}
