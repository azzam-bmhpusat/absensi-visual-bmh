/** Foto profil di bucket Storage publik 'avatars' (lihat migrasi 0017). */
export const AVATAR_BUCKET = "avatars";
/** Batas bucket 1 MB; juga di bawah batas body Server Action (1 MB). */
export const AVATAR_MAX_BYTES = 1024 * 1024;
export const AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/** Satu objek per akun; upload ulang menimpa (upsert). */
export function avatarObjectPath(userId: string): string {
  return `${userId}/avatar`;
}

/** profiles.avatar_url menyimpan path relatif + '?v=' (diisi trigger); ubah ke URL publik. */
export function avatarPublicUrl(avatarUrl: string | null | undefined, base = process.env.NEXT_PUBLIC_SUPABASE_URL): string | null {
  const path = avatarUrl?.trim();
  if (!path || !base) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${path.replace(/^\/+/, "")}`;
}

/** Validasi file upload (dipakai server action). Mengembalikan pesan galat atau null. */
export function avatarFileError(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Pilih foto terlebih dahulu.";
  if (!(AVATAR_MIME as readonly string[]).includes(file.type)) return "Format foto harus JPG, PNG, atau WebP.";
  if (file.size > AVATAR_MAX_BYTES) return "Ukuran foto maksimal 1 MB.";
  return null;
}
