"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { isBanned } from "@/lib/user-row";
import { adminProfileSchema, type AdminProfileInput } from "@/lib/profile-contact";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  type CreateUserInput,
  type UpdateUserInput,
  toUserRole,
  ROLE_LABEL,
  type UserRole,
} from "@/lib/user-schema";

export interface UserActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const DENIED: UserActionResult = {
  success: false,
  error: "Akses ditolak. Anda harus login sebagai admin.",
};

/** Masa blokir "permanen" untuk menonaktifkan akun (≈100 tahun). */
const BAN_FOREVER = "876000h";

type AdminDb = ReturnType<typeof createAdminClient>;

/** Admin yang sedang login (null bila bukan admin). Service role baru dipakai setelah lolos pengecekan ini. */
async function requireAdmin() {
  const supabase = await createClient();
  return getAdminUser(supabase);
}

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Data tidak valid";
}

async function getRole(db: AdminDb, id: string): Promise<UserRole> {
  const { data } = await db.from("profiles").select("role").eq("id", id).maybeSingle();
  return toUserRole(data?.role);
}

/** Apakah masih ada admin LAIN yang aktif (tidak diblokir)? Mencegah terkunci dari panel. */
async function hasOtherActiveAdmin(db: AdminDb, exceptId: string): Promise<boolean> {
  const { data } = await db.from("profiles").select("id").eq("role", "admin").neq("id", exceptId);
  for (const row of data ?? []) {
    const { data: found } = await db.auth.admin.getUserById(row.id);
    if (found?.user && !isBanned(found.user.banned_until)) return true;
  }
  return false;
}

function mapAuthError(error: { code?: string; status?: number; message: string }): string {
  if (error.code === "email_exists" || error.code === "user_already_exists" || /already|registered/i.test(error.message)) {
    return "Email sudah terdaftar.";
  }
  if (error.code === "weak_password") return "Kata sandi terlalu lemah.";
  if (error.code === "user_not_found") return "Pengguna tidak ditemukan.";
  return "Operasi gagal. Coba lagi.";
}

/** Pesan untuk 23505 pada profiles (indeks unik nama + perwakilan daerah). */
const DUPLICATE_PARTICIPANT = "Peserta dengan nama dan perwakilan daerah ini sudah terdaftar.";

type ProfileFields = Partial<ReturnType<typeof adminProfileSchema.parse>>;

/** Validasi sebagian data profil (hanya field yang dikirim). null bila tidak ada field. */
function parseProfile(
  profile: Partial<AdminProfileInput> | undefined
): { ok: true; data: ProfileFields | null } | { ok: false; error: string } {
  if (!profile || Object.keys(profile).length === 0) return { ok: true, data: null };
  const parsed = adminProfileSchema.partial().strict().safeParse(profile);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return { ok: true, data: parsed.data };
}

function done(message: string): UserActionResult {
  revalidatePath("/manajemen-user");
  return { success: true, message };
}

export async function createUserAction(
  input: CreateUserInput,
  profile?: Partial<AdminProfileInput>
): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (!me) return DENIED;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const { email, password, role } = parsed.data;
  // Validasi profil sebelum akun dibuat agar tidak ada akun setengah jadi.
  const profileParsed = parseProfile(profile);
  if (!profileParsed.ok) return { success: false, error: profileParsed.error };

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data?.user) {
    console.error("createUserAction gagal:", error?.code, error?.message);
    return { success: false, error: error ? mapAuthError(error) : "Gagal membuat akun." };
  }

  // Trigger database membuat baris profiles (role default); tetapkan peran pilihan admin dan data profil.
  const values = { ...(profileParsed.data ?? {}), role };
  const { error: profileError } = await db.from("profiles").update(values).eq("id", data.user.id);
  if (profileError) {
    console.error("createUserAction set profil gagal:", profileError.code, profileError.message);
    // Batalkan akun agar tidak ada akun setengah jadi dengan peran/profil yang salah.
    await db.auth.admin.deleteUser(data.user.id);
    return {
      success: false,
      error:
        profileError.code === "23505"
          ? `${DUPLICATE_PARTICIPANT} Akun dibatalkan.`
          : "Gagal menyimpan peran/profil, akun dibatalkan. Pastikan migrasi profiles sudah dijalankan.",
    };
  }

  return done(`Akun ${email} berhasil dibuat sebagai ${ROLE_LABEL[role]}.`);
}

export async function updateUserAction(
  id: string,
  input: UpdateUserInput,
  profile?: Partial<AdminProfileInput>
): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (!me) return DENIED;

  const idParsed = userIdSchema.safeParse(id);
  if (!idParsed.success) return { success: false, error: firstIssue(idParsed.error) };
  const profileParsed = parseProfile(profile);
  if (!profileParsed.ok) return { success: false, error: profileParsed.error };
  const profileFields = profileParsed.data;
  // Bila hanya profil yang berubah, data akun boleh kosong; selain itu updateUserSchema menolak perubahan kosong.
  const parsed =
    profileFields && Object.keys(input).length === 0
      ? ({ success: true, data: {} } as const)
      : updateUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const { email, role, password } = parsed.data as { email?: string; role?: UserRole; password?: string };

  const db = createAdminClient();
  const { data: found, error: findError } = await db.auth.admin.getUserById(idParsed.data);
  if (findError || !found?.user) return { success: false, error: "Pengguna tidak ditemukan." };

  // Pagar keselamatan peran: bukan akun sendiri, dan bukan admin terakhir.
  if (role !== undefined) {
    const currentRole = await getRole(db, idParsed.data);
    if (role !== currentRole) {
      if (idParsed.data === me.id) {
        return { success: false, error: "Anda tidak dapat mengubah peran akun Anda sendiri." };
      }
      if (currentRole === "admin" && !(await hasOtherActiveAdmin(db, idParsed.data))) {
        return { success: false, error: "Tidak dapat menurunkan admin terakhir yang aktif." };
      }
    }
  }

  if (email !== undefined || password !== undefined) {
    const attrs: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (email !== undefined) {
      attrs.email = email;
      attrs.email_confirm = true;
    }
    if (password !== undefined) attrs.password = password;
    const { error } = await db.auth.admin.updateUserById(idParsed.data, attrs);
    if (error) {
      console.error("updateUserAction auth gagal:", error.code, error.message);
      return { success: false, error: mapAuthError(error) };
    }
  }

  if (role !== undefined || profileFields) {
    const values = { ...(profileFields ?? {}), ...(role !== undefined ? { role } : {}) };
    const { error } = await db.from("profiles").update(values).eq("id", idParsed.data);
    if (error) {
      console.error("updateUserAction profil gagal:", error.code, error.message);
      if (error.code === "23505") return { success: false, error: DUPLICATE_PARTICIPANT };
      return { success: false, error: profileFields ? "Gagal menyimpan data profil." : "Gagal mengubah peran pengguna." };
    }
  }

  return done("Data pengguna diperbarui.");
}

export async function setUserActiveAction(id: string, active: boolean): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (!me) return DENIED;

  const idParsed = userIdSchema.safeParse(id);
  if (!idParsed.success) return { success: false, error: firstIssue(idParsed.error) };

  const db = createAdminClient();
  if (!active) {
    if (idParsed.data === me.id) {
      return { success: false, error: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
    }
    if ((await getRole(db, idParsed.data)) === "admin" && !(await hasOtherActiveAdmin(db, idParsed.data))) {
      return { success: false, error: "Tidak dapat menonaktifkan admin terakhir yang aktif." };
    }
  }

  const { error } = await db.auth.admin.updateUserById(idParsed.data, {
    ban_duration: active ? "none" : BAN_FOREVER,
  });
  if (error) {
    console.error("setUserActiveAction gagal:", error.code, error.message);
    return { success: false, error: mapAuthError(error) };
  }
  return done(active ? "Akun diaktifkan kembali." : "Akun dinonaktifkan.");
}

export async function deleteUserAction(id: string): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (!me) return DENIED;

  const idParsed = userIdSchema.safeParse(id);
  if (!idParsed.success) return { success: false, error: firstIssue(idParsed.error) };
  if (idParsed.data === me.id) {
    return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." };
  }

  const db = createAdminClient();
  if ((await getRole(db, idParsed.data)) === "admin" && !(await hasOtherActiveAdmin(db, idParsed.data))) {
    return { success: false, error: "Tidak dapat menghapus admin terakhir yang aktif." };
  }

  // Profil ikut terhapus lewat on delete cascade.
  const { error } = await db.auth.admin.deleteUser(idParsed.data);
  if (error) {
    console.error("deleteUserAction gagal:", error.code, error.message);
    return { success: false, error: mapAuthError(error) };
  }
  return done("Akun dihapus.");
}
