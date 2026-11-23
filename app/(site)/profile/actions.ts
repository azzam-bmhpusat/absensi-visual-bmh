"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/profile-contact";
import { mustChangePassword } from "@/lib/password-policy";
import { AVATAR_BUCKET, avatarFileError, avatarObjectPath } from "@/lib/avatar";

export interface ProfileActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const FIELDS = [
  "email",
  "nama",
  "perwakilan_daerah",
  "jabatan",
  "ukuran_baju",
  "no_whatsapp",
  "rencana_kedatangan",
  "keterangan_kehadiran",
] as const;

/** Menyimpan seluruh data profil milik akun yang sedang login. */
export async function updateProfile(
  _prev: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const raw = Object.fromEntries(FIELDS.map((f) => [f, formData.get(f)?.toString() ?? ""]));
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { email, ...fields } = parsed.data;

  try {
    const admin = createAdminClient();

    // Dialog di UI bisa dilewati lewat request langsung; tolak juga di server.
    const { data: current } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (mustChangePassword(user, current?.role)) {
      return { success: false, error: "Ganti kata sandi awal Anda terlebih dahulu." };
    }

    // Profil dulu; bila gagal, email tidak ikut berubah.
    const { error } = await admin.from("profiles").update(fields).eq("id", user.id);
    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Peserta dengan nama dan perwakilan daerah ini sudah terdaftar." };
      }
      return { success: false, error: "Gagal menyimpan: " + error.message };
    }

    if (email !== (user.email ?? "").toLowerCase()) {
      const { error: emailError } = await admin.auth.admin.updateUserById(user.id, {
        email,
        email_confirm: true,
      });
      if (emailError) {
        const taken = /already|registered|exists|duplicate/i.test(emailError.message);
        return {
          success: false,
          error: taken
            ? "Email sudah dipakai akun lain. Data lain sudah tersimpan."
            : "Data tersimpan, tetapi email gagal diubah: " + emailError.message,
        };
      }
    }
  } catch (err) {
    console.error("Error updateProfile:", err);
    return { success: false, error: "Terjadi kesalahan saat menyimpan profil." };
  }

  revalidatePath("/profile");
  return { success: true, message: "Profil berhasil disimpan." };
}

/** Sesi + aturan ganti kata sandi awal, sama seperti updateProfile. */
async function avatarOwner(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Silakan masuk kembali." };
  const { data: current } = await createAdminClient().from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (mustChangePassword(user, current?.role)) return { error: "Ganti kata sandi awal Anda terlebih dahulu." };
  return { userId: user.id };
}

/**
 * Mengunggah foto profil ke bucket 'avatars' (menimpa foto lama).
 * profiles.avatar_url diisi trigger storage.objects (migrasi 0017), bukan di sini.
 */
export async function uploadAvatar(formData: FormData): Promise<ProfileActionResult> {
  const file = formData.get("avatar");
  const invalid = avatarFileError(file);
  if (invalid) return { success: false, error: invalid };

  try {
    const owner = await avatarOwner();
    if ("error" in owner) return { success: false, error: owner.error };

    const { error } = await createAdminClient()
      .storage.from(AVATAR_BUCKET)
      .upload(avatarObjectPath(owner.userId), file as File, {
        upsert: true,
        contentType: (file as File).type,
        cacheControl: "3600",
      });
    if (error) return { success: false, error: "Gagal mengunggah foto: " + error.message };
  } catch (err) {
    console.error("Error uploadAvatar:", err);
    return { success: false, error: "Terjadi kesalahan saat mengunggah foto." };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Foto profil diperbarui." };
}

/** Menghapus foto profil; trigger mengosongkan profiles.avatar_url. */
export async function removeAvatar(): Promise<ProfileActionResult> {
  try {
    const owner = await avatarOwner();
    if ("error" in owner) return { success: false, error: owner.error };

    const { error } = await createAdminClient().storage.from(AVATAR_BUCKET).remove([avatarObjectPath(owner.userId)]);
    if (error) return { success: false, error: "Gagal menghapus foto: " + error.message };
  } catch (err) {
    console.error("Error removeAvatar:", err);
    return { success: false, error: "Terjadi kesalahan saat menghapus foto." };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Foto profil dihapus." };
}
