import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CONTENT_TAGS, albumToView, materiToView, notulaToView, roomToKamar,
  type AlbumKegiatan, type AlbumRow, type InfoPenting, type InfoRow, type Kamar, type KontakPanitia,
  type MateriPresentasi, type MateriRow, type NotulaRapat, type NotulaRow, type RoomRow,
} from "@/lib/content/schema";

/**
 * Baca konten untuk halaman publik. Service role (dipanggil server-side, halaman
 * sudah dibatasi ProfileGate); di-cache per tag, dibersihkan oleh server action admin.
 */
export const ROOM_SELECT = "id, nomor, lantai, kapasitas, urutan, hotel_room_occupants(profile_id, profiles(nama, perwakilan_daerah))";

async function rows<T>(table: string, select = "*"): Promise<T[]> {
  const { data, error } = await createAdminClient().from(table).select(select)
    .order("urutan").order("id");
  if (error) throw new Error(`Gagal memuat ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function getHotelContent(): Promise<{ kamar: Kamar[]; info: InfoPenting[]; kontak: KontakPanitia | null }> {
  "use cache";
  cacheTag(CONTENT_TAGS.hotel);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const [rooms, info, kontak] = await Promise.all([
    rows<RoomRow>("hotel_rooms", ROOM_SELECT),
    rows<InfoRow>("hotel_info_items"),
    createAdminClient().from("hotel_contact").select("nama, whatsapp").eq("id", 1).maybeSingle(),
  ]);
  return {
    kamar: rooms.map(roomToKamar),
    info: info.map(({ judul, isi }) => ({ judul, isi })),
    kontak: kontak.data ?? null,
  };
}

export async function getAlbumKegiatan(): Promise<AlbumKegiatan[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.galeri);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return (await rows<AlbumRow>("gallery_albums")).map(albumToView);
}

export async function getMateriPresentasi(): Promise<MateriPresentasi[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.materi);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return (await rows<MateriRow>("presentation_materials")).map(materiToView);
}

export async function getNotulaRapat(): Promise<NotulaRapat[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.notula);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return (await rows<NotulaRow>("meeting_minutes")).map(notulaToView);
}

/** Untuk halaman admin (tanpa cache). */
export const readAdminRows = rows;
