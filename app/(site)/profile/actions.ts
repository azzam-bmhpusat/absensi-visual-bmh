"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/profile-contact";

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
