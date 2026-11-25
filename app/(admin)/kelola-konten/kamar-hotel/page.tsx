import { createAdminClient } from "@/lib/supabase/admin";
import { ROOM_SELECT, readAdminRows } from "@/lib/content/server";
import type { RoomRow } from "@/lib/content/schema";
import { ContentManager, type ContentRowData } from "@/components/admin/content-manager";
import { HotelContactForm, RoomManager, type PesertaOption } from "@/components/admin/room-occupants";
import { KontenHeader, requireAdminPage } from "../shared";

export const instant = false;

export default async function KelolaKamarHotelPage() {
  await requireAdminPage();
  const db = createAdminClient();
  const [rooms, info, kontak, peserta] = await Promise.all([
    readAdminRows<RoomRow>("hotel_rooms", ROOM_SELECT),
    readAdminRows<ContentRowData>("hotel_info_items"),
    db.from("hotel_contact").select("nama, whatsapp").eq("id", 1).maybeSingle(),
    db.from("profiles").select("id, nama, perwakilan_daerah, hotel_room_occupants(room_id)")
      .eq("role", "peserta").not("nama", "is", null).order("nama"),
  ]);

  const pesertaOptions: PesertaOption[] = (peserta.data ?? []).map((p) => {
    const occ = p.hotel_room_occupants as { room_id: number }[] | { room_id: number } | null;
    const roomId = Array.isArray(occ) ? occ[0]?.room_id ?? null : occ?.room_id ?? null;
    return { id: p.id, nama: p.nama?.trim() || "(tanpa nama)", wilayah: p.perwakilan_daerah?.trim() || "-", roomId };
  });

  return (
    <>
      <KontenHeader
        title="Informasi Kamar Hotel"
        description="Kamar, penghuni (akun ber-role peserta), info & ketentuan, serta kontak akomodasi."
        publicHref="/informasi-kamar-hotel"
      />
      <RoomManager
        rooms={rooms.map(({ hotel_room_occupants, ...r }) => ({ ...r, penghuni: hotel_room_occupants.map((o) => o.profile_id) }))}
        peserta={pesertaOptions}
      />
      <ContentManager kind="info" rows={info} />
      <HotelContactForm initial={kontak.data ?? null} />
    </>
  );
}
